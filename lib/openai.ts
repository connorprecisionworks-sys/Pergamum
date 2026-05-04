// Tiny OpenAI Chat Completions wrapper.
// We don't pull the `openai` SDK in — the API surface we need (one chat call,
// JSON or text out) is a half-dozen lines of fetch, and avoiding the dep keeps
// the bundle and install graph small.
//
// Used by /api/build/improve-block and /api/build/generate-from-goal to give
// the prompt builder a hand without committing the rest of the app to OpenAI.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// gpt-4o-mini gets us solid restructuring quality for fractions of a cent
// per call. The builder calls are short — one block in, one block out.
const DEFAULT_MODEL = "gpt-4o-mini";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Force valid-JSON output. Set when you'll JSON.parse() the response. */
  jsonMode?: boolean;
}

export class OpenAIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "OpenAIError";
  }
}

export async function chatComplete(
  messages: ChatMessage[],
  opts: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIError(
      "OPENAI_API_KEY is not set on the server.",
      500
    );
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 600,
      messages,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message ?? "";
    } catch {
      // ignore parse failure
    }
    throw new OpenAIError(
      `OpenAI request failed (${res.status})${detail ? `: ${detail}` : ""}`,
      res.status
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new OpenAIError("OpenAI returned an empty response.", 502);
  }
  return content;
}
