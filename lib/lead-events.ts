import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/types/database";

/**
 * Fire-and-forget wrapper around the record_lead_event RPC
 * (HOT-LEAD-HEAT-SPEC.md). A scoring-pipeline failure should never surface
 * to the user or block the action it rides along with — same best-effort
 * contract as logPromptRun's own raw insert. Works from a client- or
 * server-created Supabase instance; the RPC resolves the lead from the
 * caller's own session (auth.uid()), never a passed-in id.
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
    () => {},
    () => {}
  );
}
