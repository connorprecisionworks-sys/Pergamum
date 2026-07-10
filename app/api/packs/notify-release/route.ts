import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/packs/notify-release
 * Body: { packId: string, type: "pack_released" | "pack_updated" }
 *
 * Fans a pack release/update notification out to everyone who saved the
 * pack or follows the creator. Mirrors /api/prompts/notify-update: uses
 * the service-role client because pack_saves is owner-only under RLS —
 * the creator's own session can't see who saved their pack.
 *
 * Fire-and-forget from the caller: authorization failures and DB errors
 * both resolve to a 200 rather than surfacing, since this must never
 * block the release it rode in on.
 */
export async function POST(request: Request) {
  let body: { packId?: string; type?: string };
  try {
    body = (await request.json()) as { packId?: string; type?: string };
  } catch {
    return NextResponse.json({ ok: true });
  }

  const packId = body.packId;
  const type = body.type === "pack_updated" ? "pack_updated" : "pack_released";
  if (!packId || typeof packId !== "string") {
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

  const { data: pack } = await service.from("packs").select("id, creator_id").eq("id", packId).single();
  if (!pack || pack.creator_id !== user.id) {
    return NextResponse.json({ ok: true });
  }

  const [{ data: saveRows }, { data: followRows }] = await Promise.all([
    service.from("pack_saves").select("user_id").eq("pack_id", packId),
    service.from("follows").select("follower_id").eq("following_id", user.id),
  ]);

  const recipients = new Set<string>();
  (saveRows ?? []).forEach((r) => recipients.add(r.user_id));
  (followRows ?? []).forEach((r) => recipients.add(r.follower_id));
  recipients.delete(user.id);

  if (recipients.size > 0) {
    const notifications = Array.from(recipients).map((recipientId) => ({
      user_id: recipientId,
      type,
      pack_id: packId,
    }));
    await service.from("notifications").insert(notifications);
  }

  return NextResponse.json({ ok: true });
}
