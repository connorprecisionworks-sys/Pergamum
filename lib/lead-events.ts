import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/types/database";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.useprmpt.com";

interface RecordLeadEventResult {
  score: number;
  stage: string;
  alert_fired: boolean;
}

/**
 * Fire-and-forget wrapper around the record_lead_event RPC
 * (HOT-LEAD-HEAT-SPEC.md). A scoring-pipeline failure should never surface
 * to the user or block the action it rides along with — same best-effort
 * contract as logPromptRun's own raw insert. Works from a client- or
 * server-created Supabase instance; the RPC resolves the lead from the
 * caller's own session (auth.uid()), never a passed-in id.
 *
 * When the RPC reports alert_fired, this also triggers the alert email via
 * an HTTP round trip to /api/leads/send-alert-email rather than importing
 * the send path directly — this helper runs from both client components
 * and server actions (claim.ts), and email sending (the Resend key) can
 * only ever execute server-side, so the API route is the one path that
 * works uniformly from every call site. An absolute URL is required
 * because a server action has no browser origin to resolve a relative
 * fetch against.
 */
export function recordLeadEvent(
  supabase: SupabaseClient<Database>,
  eventType: string,
  promptId: string | null,
  packId: string | null,
  meta: Record<string, unknown> = {}
): Promise<void> {
  return Promise.resolve(
    supabase.rpc("record_lead_event", {
      p_event_type: eventType,
      p_prompt_id: promptId ?? undefined,
      p_pack_id: packId ?? undefined,
      p_meta: meta as Json,
    })
  ).then(
    (result) => {
      const data = result.data as RecordLeadEventResult | null;
      if (!data?.alert_fired) return;
      fetch(`${APP_URL}/api/leads/send-alert-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId,
          packId,
          score: data.score,
          stage: data.stage,
          triggerEventType: eventType,
        }),
      }).catch(() => {});
    },
    () => {}
  );
}
