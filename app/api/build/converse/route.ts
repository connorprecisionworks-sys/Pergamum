import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { chatComplete, OpenAIError } from "@/lib/openai";
import { hasBuildAccess } from "@/lib/build-access";

// One unified endpoint backing the conversational builder. The client passes
// the full message history plus the current draft (if there is one); the
// model replies with either a single clarifying question OR a finished
// prompt. The five-block structure is enforced server-side and the user
// never has to think about it.

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const currentDraftSchema = z.object({
  title: z.string().max(200).optional(),
  role: z.string().max(2000).optional(),
  context: z.string().max(4000).optional(),
  task: z.string().max(2000).optional(),
  constraints: z.string().max(2000).optional(),
  output_format: z.string().max(2000).optional(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  current: currentDraftSchema.optional(),
});

/**
 * Permissive shape detection for the model's reply. We don't strict-parse —
 * the model occasionally adds extra fields, exceeds caps, or misnames the
 * discriminator, and we'd rather forgive than 502 the user.
 */
type YesNoQuestion = { id: string; text: string };

type ConverseResponse =
  | { kind: "question"; text: string }
  | { kind: "yesno"; questions: YesNoQuestion[] }
  | {
      kind: "ready";
      blurb: string;
      title: string;
      role: string;
      context: string;
      task: string;
      constraints: string;
      output_format: string;
    };

function asString(v: unknown, max = 8000): string {
  if (typeof v !== "string") return "";
  return v.length > max ? v.slice(0, max) : v;
}

function normaliseConverseResponse(raw: unknown): ConverseResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;

  const kind = typeof j.kind === "string" ? j.kind.toLowerCase() : "";

  // Yes/no questions — first-turn clarification cards.
  const yesnoLikeKind =
    kind === "yesno" || kind === "yes_no" || kind === "questions" || kind === "clarify";
  if (yesnoLikeKind && Array.isArray(j.questions)) {
    const questions: YesNoQuestion[] = j.questions
      .filter((q): q is Record<string, unknown> => !!q && typeof q === "object")
      .map((q, i) => ({
        id: typeof q.id === "string" && q.id.trim() ? q.id.trim() : `q${i + 1}`,
        text: asString(q.text ?? q.question, 200).trim(),
      }))
      .filter((q) => q.text.length > 0)
      .slice(0, 3);
    if (questions.length > 0) {
      return { kind: "yesno", questions };
    }
  }

  // Free-form question shape — kept for back-compat with older system prompts.
  const questionLikeKind =
    kind === "question" || kind === "ask";
  const text = asString(j.text ?? j.question, 1000).trim();
  if (questionLikeKind && text) {
    return { kind: "question", text };
  }

  // Ready shape — we'll accept it even if `kind` is missing as long as we
  // see at least one of the structural fields populated.
  const role = asString(j.role);
  const context = asString(j.context);
  const task = asString(j.task);
  const constraints = asString(j.constraints);
  const output_format = asString(j.output_format ?? j.output ?? j.format);
  const anyReady =
    role || context || task || constraints || output_format;

  if (anyReady) {
    return {
      kind: "ready",
      blurb: asString(j.blurb ?? j.summary ?? j.message, 600) || "Here's your prompt.",
      title: asString(j.title, 200),
      role,
      context,
      task,
      constraints,
      output_format,
    };
  }

  // Pure question fallback — if there's a text field but kind was off, treat it as a question.
  if (text) return { kind: "question", text };

  return null;
}

const SYSTEM_PROMPT = `You are a prompt-engineering assistant. The user describes something they want an AI to do for them. Your job is to produce a finished, structured prompt they can copy and use.

You always reply in strict JSON, with one of these shapes:

1. yesno — Use this on the FIRST turn when the user has just submitted their brief and there is no existing draft yet. Generate 2 or 3 short yes/no clarifying questions that would meaningfully change how the prompt is designed.
   { "kind": "yesno", "questions": [
     { "id": "q1", "text": "<short yes/no question>" },
     { "id": "q2", "text": "<short yes/no question>" }
   ] }

2. ready — Use this when:
   - The user has answered the yes/no questions in a follow-up message
   - The user explicitly asked to skip the questions
   - The user is refining an existing draft (current draft was supplied)
   - The brief is so specific that no clarification is needed

   {
     "kind": "ready",
     "blurb": "<one short conversational sentence — e.g. 'Here's a prompt you can use.' or 'Updated — try this version.'>",
     "title": "<short descriptive title, max 8 words>",
     "role": "<one sentence naming a specific persona>",
     "context": "<the facts the model will need; use {{variable_name}} placeholders for inputs that change between runs>",
     "task": "<single unambiguous instruction in the imperative>",
     "constraints": "<bulleted list using '- ' prefixes; do/don't rules that prevent unwanted output>",
     "output_format": "<concrete shape — format, length, structure>"
   }

Rules for yes/no questions:
- Each question must be answerable with yes or no — no scales, no either/or
- Maximum 3 questions, prefer 2 — pick the most impactful design forks, not trivia
- Phrase positively so "yes" usually means "include this" or "prefer this"
- Keep each question under 12 words

Rules for ready prompts:
- Use {{variable_name}} for any input that will change run-to-run (transcripts, names, numbers, etc.). Don't put real example values in the prompt — those go in context as placeholders.
- If a previous draft exists in the conversation and the user is refining, return "ready" with the revised blocks. Preserve everything they didn't ask to change.

Target-environment awareness — CRITICAL:
Different AI tools have different I/O models. The prompt's structure must match the tool that will run it.

- "In-context" tools — ChatGPT, Claude.ai web, plain OpenAI/Anthropic API calls, Gemini, etc.
  The user pastes everything the model needs into the chat. Use {{variable_name}} placeholders for any inputs that change between runs (transcripts, snippets, customer messages, document text). This is the default assumption.

- "Agentic" tools — Claude Code, Cursor, GitHub Copilot, Aider, terminal-based agents, IDE-integrated assistants, anything with file-system or repo access.
  The agent ALREADY has access to the user's codebase, files, terminal, and project context. Do NOT use {{code_snippet}}, {{file_contents}}, {{transcript_of_changes}}, or any variable for content the agent can see for itself. Instead write direct instructions referring to "the current file", "the codebase", "the changes in this PR", "the failing test", etc. Variables in agentic prompts should only be for things the agent CAN'T see — a target framework name, a desired tone, a customer's industry.

- Image/video models (Midjourney, DALL-E, Sora, Runway) and voice tools have their own conventions; if the brief mentions them, lean on terse descriptive language and skip the 5-block formality if it doesn't fit.

If the brief explicitly names a tool (Claude Code, Cursor, ChatGPT, etc.), match that tool's I/O model. If the brief mentions code review, refactoring, debugging, or anything code-related but is silent on the tool, ASK as one of your yes/no questions — for example: "Is this for an agentic tool that already has access to your codebase (like Claude Code or Cursor)?"

Never include preamble, explanation, or markdown fences. Pure JSON only.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to use the prompt builder." },
      { status: 401 }
    );
  }

  // Soft beta gate — same cookie the /build page uses.
  if (!(await hasBuildAccess())) {
    return NextResponse.json(
      { error: "The prompt builder is in private beta. Enter your access code at /build." },
      { status: 403 }
    );
  }

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { messages, current } = parsed;

  // Stitch the conversation together for the model. If there's a current
  // draft, prepend it as a system note so the model can revise rather than
  // restart when the user says "make the tone more casual".
  const promptMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (current && Object.values(current).some((v) => (v ?? "").trim().length > 0)) {
    const currentSummary = [
      current.title ? `Title: ${current.title}` : "",
      current.role ? `Role: ${current.role}` : "",
      current.context ? `Context: ${current.context}` : "",
      current.task ? `Task: ${current.task}` : "",
      current.constraints ? `Constraints: ${current.constraints}` : "",
      current.output_format ? `Output format: ${current.output_format}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    promptMessages.push({
      role: "system",
      content: `Current draft of the prompt (revise this if the user asks for changes):\n\n${currentSummary}`,
    });
  }

  for (const m of messages) {
    promptMessages.push({ role: m.role, content: m.content });
  }

  try {
    const raw = await chatComplete(promptMessages, {
      temperature: 0.4,
      maxTokens: 1100,
      jsonMode: true,
    });

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      // The model occasionally wraps JSON in code fences; strip and retry.
      const stripped = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      try {
        json = JSON.parse(stripped);
      } catch {
        // eslint-disable-next-line no-console
        console.error("[converse] non-JSON response from model:", raw.slice(0, 600));
        return NextResponse.json(
          { error: "The model didn't return valid JSON. Try rephrasing." },
          { status: 502 }
        );
      }
    }

    const normalised = normaliseConverseResponse(json);
    if (!normalised) {
      // eslint-disable-next-line no-console
      console.error("[converse] unexpected response shape:", JSON.stringify(json).slice(0, 600));
      return NextResponse.json(
        { error: "The model returned an unexpected shape. Try sending again." },
        { status: 502 }
      );
    }

    return NextResponse.json(normalised);
  } catch (err) {
    if (err instanceof OpenAIError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Builder failed";
    // eslint-disable-next-line no-console
    console.error("[converse] unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
