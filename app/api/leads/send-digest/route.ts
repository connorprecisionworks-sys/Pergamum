import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendHotLeadDigestEmail } from "@/lib/email/hot-lead";

export const dynamic = "force-dynamic";

/**
 * GET /api/leads/send-digest
 * Vercel Cron target (see vercel.json) — the daily-digest half of
 * HOT-LEAD-HEAT-SPEC.md's email delivery. "Unsent" is approximated as
 * unread hot_lead notifications from the last 24h: there is no dedicated
 * emailed_at column (no migration in this run), so read_at is the only
 * signal available, and it's marked read after a successful send so the
 * next day's digest doesn't repeat the same alerts.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: "RESEND_API_KEY not set" });
  }

  const service = await createServiceClient();

  const { data: digestCreators } = await service
    .from("creator_alert_settings")
    .select("creator_id")
    .eq("email", true)
    .eq("email_mode", "daily_digest");

  let sent = 0;
  for (const creator of digestCreators ?? []) {
    const { data: notifications } = await service
      .from("notifications")
      .select("id, payload")
      .eq("user_id", creator.creator_id)
      .eq("type", "hot_lead")
      .is("read_at", null)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!notifications || notifications.length === 0) continue;

    const { data: authUser } = await service.auth.admin.getUserById(creator.creator_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    await sendHotLeadDigestEmail(
      email,
      notifications.map((n) => (n.payload ?? {}) as { score?: number; stage?: string; trigger_event_type?: string })
    );
    await service
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in(
        "id",
        notifications.map((n) => n.id)
      );
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
