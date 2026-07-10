import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/prompts/notify-update
 * Body: { promptId: string }
 *
 * Fans a "this prompt was updated" notification out to everyone who
 * follows the author or has the prompt saved in a collection. Uses the
 * service-role client because collection_prompts' RLS only lets the
 * author see saves in collections that are public or their own — a
 * private collection belonging to someone else is invisible to the
 * author's own session, so a client-side query would silently miss
 * those recipients.
 *
 * Fire-and-forget from the caller: authorization failures and DB errors
 * both resolve to a 200 rather than surfacing, since this must never
 * block the publish it rode in on.
 */
export async function POST(request: Request) {
  let body: { promptId?: string };
  try {
    body = (await request.json()) as { promptId?: string };
  } catch {
    return NextResponse.json({ ok: true });
  }

  const promptId = body.promptId;
  if (!promptId || typeof promptId !== "string") {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const service = await createServiceClient();

  const { data: prompt } = await service
    .from("prompts")
    .select("id, author_id")
    .eq("id", promptId)
    .single();

  // Only the actual author can trigger notifications for their own prompt.
  if (!prompt || prompt.author_id !== user.id) {
    return NextResponse.json({ ok: true });
  }

  const [{ data: followRows }, { data: collectionRows }] = await Promise.all([
    service.from("follows").select("follower_id").eq("following_id", user.id),
    service.from("collection_prompts").select("collections(owner_id)").eq("prompt_id", promptId),
  ]);

  const recipients = new Set<string>();
  (followRows ?? []).forEach((f) => recipients.add(f.follower_id));
  (collectionRows ?? []).forEach((row) => {
    const owner = (row as { collections: { owner_id: string } | null }).collections;
    if (owner?.owner_id) recipients.add(owner.owner_id);
  });
  recipients.delete(user.id);

  if (recipients.size > 0) {
    const notifications = Array.from(recipients).map((recipientId) => ({
      user_id: recipientId,
      type: "prompt_updated",
      prompt_id: promptId,
    }));
    await service.from("notifications").insert(notifications);
  }

  return NextResponse.json({ ok: true });
}
