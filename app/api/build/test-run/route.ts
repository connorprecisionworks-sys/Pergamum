import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { chatComplete, OpenAIError } from "@/lib/openai";
import { hasBuildAccess } from "@/lib/build-access";
import { substituteVariables } from "@/lib/utils";

// Run the assembled prompt against a real model with the user's chosen
// variable values. This is the feature that closes the "but I could just
// iterate in ChatGPT" loop — design + validate + tweak in one place.

export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().min(10).max(20_000),
  variables: z.record(z.string().max(8000)).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to test prompts." },
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

  const { prompt, variables } = parsed;

  // Fill in any {{variable_name}} placeholders the user provided values for.
  // Missing values stay as-is so the model sees the placeholder verbatim and
  // we don't silently drop a piece of context.
  const filled = substituteVariables(prompt, variables ?? {});

  try {
    const output = await chatComplete(
      [
        // We pass the entire assembled prompt as a single user turn — that
        // matches how a developer would actually call the model in production
        // when they paste this prompt into their app.
        { role: "user", content: filled },
      ],
      { temperature: 0.6, maxTokens: 1200 }
    );
    return NextResponse.json({ output, prompt: filled });
  } catch (err) {
    if (err instanceof OpenAIError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Test run failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
