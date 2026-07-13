import { createClient } from "@/lib/supabase/client";
import { recordLeadEvent } from "@/lib/lead-events";

/**
 * Fire-and-forget log of a prompt fill-in — one row per Copy or AI-launcher
 * click, powering the "Recent" list. Never awaited by callers; a failed
 * insert (RLS, network) shouldn't affect the copy/launch it rode along with.
 *
 * Also mirrors the run into lead_events via record_lead_event — the RPC
 * derives vars_filled_pct itself server-side from the raw values compared
 * against the prompt's variable defaults (HOT-LEAD-HEAT-SPEC.md S4), so the
 * full values object is passed, not a pre-computed percentage.
 */
export function logPromptRun(
  promptId: string,
  userId: string,
  values: Record<string, string>
): void {
  const supabase = createClient();
  supabase
    .from("prompt_runs")
    .insert({ user_id: userId, prompt_id: promptId, values })
    .then(
      () => {},
      () => {}
    );
  void recordLeadEvent(supabase, "prompt_run", promptId, null, { values });
}
