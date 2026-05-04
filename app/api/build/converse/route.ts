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

const responseSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("question"),
    text: z.string().min(1).max(500),
  }),
  z.object({
    kind: z.literal("ready"),
    blurb: z.string().min(1).max(400),
    title: z.string().max(120),
    role: z.string(),
    context: z.string(),
    task: z.string(),
    constraints: z.string(),
    output_format: z.string(),
  }),
]);

const SYSTEM_PROMPT = `You are a prompt-engineering coach. The user describes something they want an AI to do for them. Your job is to produce a finished, structured prompt they can copy and use.

You always reply in strict JSON, with one of these two shapes:

1. When you need more information to write a good prompt:
   { "kind": "question", "text": "<one short, specific question>" }

2. When you have enough to produce a finished prompt:
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

Rules:
- Default to "ready". Only ask a question when the goal is genuinely ambiguous and you couldn't pick a sensible default. Never ask more than 2 questions total before producing a prompt — if you've already asked once, lean toward generating.
- Ask only ONE question at a time. Make it short, friendly, plain English. No numbered lists.
- Use {{variable_name}} for any input that will change run-to-run (transcripts, names, numbers, etc). Don't put real example values in the prompt — those go in the context as placeholders.
- If a previous draft exists in the conversation and the user is asking for a change, return "ready" with the revised blocks. Preserve everything they didn't ask to change.
- Never include preamble, explanation, or markdown fences in your reply. Pure JSON only.`;

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
      return NextResponse.json(
        { error: "The model returned malformed JSON. Try rephrasing." },
        { status: 502 }
      );
    }

    const validated = responseSchema.parse(json);
    return NextResponse.json(validated);
  } catch (err) {
    if (err instanceof OpenAIError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "The model returned an unexpected shape. Try again." },
        { status: 502 }
      );
    }
    const message = err instanceof Error ? err.message : "Builder failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
