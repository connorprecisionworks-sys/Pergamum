import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { VoteValue } from "@/lib/types/database";

/**
 * POST /api/skills/vote
 * Body: { skillId: string; value: -1 | 1 }
 *
 * Mirrors /api/vote (the prompt voter): same rate-limit table, same
 * toggle/change/insert semantics. Returns { action, value? }.
 */
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

  // Reuse the existing rate-limit table (max 10 vote actions per minute,
  // shared across prompts and skills — both are vote actions).
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  // eslint-disable-next-line
  const { count: recentCount } = await (supabase as any)
    .from("rate_limit_vote_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneMinuteAgo);

  if ((recentCount ?? 0) >= 10) {
    return NextResponse.json(
      { error: "You're voting too quickly — please slow down." },
      { status: 429 }
    );
  }

  // eslint-disable-next-line
  (supabase as any)
    .from("rate_limit_vote_log")
    .insert({ user_id: user.id })
    .then(() => {});

  let body: { skillId: string; value: VoteValue };
  try {
    body = (await request.json()) as { skillId: string; value: VoteValue };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { skillId, value } = body;

  if (!skillId || (value !== 1 && value !== -1)) {
    return NextResponse.json(
      { error: "skillId and value (-1 or 1) are required." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("skill_votes")
    .select("value")
    .eq("user_id", user.id)
    .eq("skill_id", skillId)
    .single();

  if (existing) {
    if (existing.value === value) {
      const { error } = await supabase
        .from("skill_votes")
        .delete()
        .eq("user_id", user.id)
        .eq("skill_id", skillId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ action: "removed" });
    } else {
      const { error } = await supabase
        .from("skill_votes")
        .update({ value })
        .eq("user_id", user.id)
        .eq("skill_id", skillId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ action: "changed", value });
    }
  } else {
    const { error } = await supabase.from("skill_votes").insert({
      user_id: user.id,
      skill_id: skillId,
      value,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: "added", value });
  }
}
