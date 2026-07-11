import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasBuildAccess } from "@/lib/build-access";
import { chatComplete, OpenAIError } from "@/lib/openai";

/**
 * POST /api/packs/ai-draft
 * Body: { kind: "promise_line", title: string, description?: string }
 *     | { kind: "liner_note", packTitle: string, itemTitles: string[], creatorName?: string }
 *
 * Drafts a starting point for the builder's auto-drafted copy (promise
 * lines per track, the liner note). Always a suggestion — every field
 * stays inline-editable, never a black box.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  // Rides the same private beta as /build. The rest of the pack flow — adding
  // prompts, arranging, cover variants, release — stays open to everyone.
  if (!(await hasBuildAccess())) {
    return NextResponse.json(
      { error: "AI drafting is in private beta. Enter your access code at /build." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    if (body.kind === "promise_line") {
      const title = String(body.title ?? "").slice(0, 200);
      const description = String(body.description ?? "").slice(0, 800);
      if (!title) return NextResponse.json({ error: "Missing title." }, { status: 400 });

      const text = await chatComplete(
        [
          {
            role: "system",
            content:
              "You write one-line 'promise lines' for items in a creator's prompt pack — the single sentence that tells someone what they get from running it. Punchy, concrete, no hype adjectives, under 90 characters, no trailing period, no quotes around the output.",
          },
          {
            role: "user",
            content: `Title: ${title}\n${description ? `Description: ${description}` : ""}\n\nWrite the promise line.`,
          },
        ],
        { maxTokens: 60, temperature: 0.6 }
      );
      return NextResponse.json({ text: text.trim().replace(/^["']|["']$/g, "") });
    }

    if (body.kind === "liner_note") {
      const packTitle = String(body.packTitle ?? "").slice(0, 200);
      const itemTitles = Array.isArray(body.itemTitles) ? (body.itemTitles as unknown[]).map(String).slice(0, 20) : [];
      const creatorName = body.creatorName ? String(body.creatorName).slice(0, 100) : "the creator";
      if (!packTitle) return NextResponse.json({ error: "Missing packTitle." }, { status: 400 });

      const text = await chatComplete(
        [
          {
            role: "system",
            content:
              "You write short 'liner notes' for a creator's released prompt pack — one warm, specific paragraph (2-4 sentences) in first person, like album liner notes. No hype, no emoji, no bullet points. It should say what the pack is for and why the creator built it.",
          },
          {
            role: "user",
            content: `Pack title: ${packTitle}\nCreator: ${creatorName}\nTracks: ${itemTitles.join(", ") || "(not listed yet)"}\n\nWrite the liner note.`,
          },
        ],
        { maxTokens: 220, temperature: 0.7 }
      );
      return NextResponse.json({ text: text.trim() });
    }

    return NextResponse.json({ error: "Unknown kind." }, { status: 400 });
  } catch (err) {
    if (err instanceof OpenAIError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Couldn't draft that right now." }, { status: 500 });
  }
}
