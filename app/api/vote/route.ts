import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { VoteValue } from "@/lib/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to vote." },
      { status: 401 }
    );
  }

  let body: { promptId: string; value: VoteValue };
  try {
    body = await request.json() as { promptId: string; value: VoteValue };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { promptId, value } = body;

  if (!promptId || (value !== 1 && value !== -1)) {
    return NextResponse.json(
      { error: "promptId and value (-1 or 1) are required." },
      { status: 400 }
    );
  }

  // Check for existing vote
  const { data: existing } = await supabase
    .from("votes")
    .select("value")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .single();

  if (existing) {
    if (existing.value === value) {
      // Same vote → remove it (toggle off)
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("user_id", user.id)
        .eq("prompt_id", promptId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ action: "removed" });
    } else {
      // Different vote → change direction
      const { error } = await supabase
        .from("votes")
        .update({ value })
        .eq("user_id", user.id)
        .eq("prompt_id", promptId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ action: "changed", value });
    }
  } else {
    // New vote
    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      prompt_id: promptId,
      value,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ action: "added", value });
  }
}
