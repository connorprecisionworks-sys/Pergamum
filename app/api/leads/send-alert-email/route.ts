import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendHotLeadEmail } from "@/lib/email/hot-lead";

/**
 * POST /api/leads/send-alert-email
 * Body: { promptId: string|null, packId: string|null, score: number, stage: string }
 *
 * Fired by lib/lead-events.ts's recordLeadEvent() whenever record_lead_event
 * returns alert_fired — from both client components and server actions
 * (claim.ts), which is why this is a real HTTP round trip instead of a
 * direct import: email sending (the Resend key) can only ever run
 * server-side, and recordLeadEvent has no other way to reach server-only
 * code uniformly from every call site.
 *
 * Never trusts a creator id from the caller — same "derive from prompt/pack"
 * rule record_lead_event itself follows. Always responds 200: a failure
 * here must never surface as a user-facing error, since the lead event this
 * rode in on already succeeded before this fires.
 */
export async function POST(request: Request) {
  let body: {
    promptId?: string | null;
    packId?: string | null;
    score?: number;
    stage?: string;
    triggerEventType?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: "RESEND_API_KEY not set" });
  }

  const service = await createServiceClient();

  let creatorId: string | null = null;
  if (body.promptId) {
    const { data } = await service.from("prompts").select("author_id").eq("id", body.promptId).maybeSingle();
    creatorId = data?.author_id ?? null;
  } else if (body.packId) {
    const { data } = await service.from("packs").select("creator_id").eq("id", body.packId).maybeSingle();
    creatorId = data?.creator_id ?? null;
  }
  if (!creatorId) return NextResponse.json({ ok: true });

  const { data: settings } = await service
    .from("creator_alert_settings")
    .select("email, email_mode")
    .eq("creator_id", creatorId)
    .maybeSingle();

  // Defaults match creator_alert_settings' own column defaults when no row
  // exists yet (record_lead_event falls back the same way). Digest creators
  // are rolled up by /api/leads/send-digest instead of an instant send here.
  const emailOn = settings?.email ?? true;
  const emailMode = settings?.email_mode ?? "instant";
  if (!emailOn || emailMode !== "instant") return NextResponse.json({ ok: true });

  const { data: authUser } = await service.auth.admin.getUserById(creatorId);
  const email = authUser?.user?.email;
  if (!email) return NextResponse.json({ ok: true });

  await sendHotLeadEmail(email, body.score ?? 0, body.stage ?? "hot", body.triggerEventType);

  return NextResponse.json({ ok: true });
}
