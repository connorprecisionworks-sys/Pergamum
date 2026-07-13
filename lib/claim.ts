"use server";

import { createClient } from "@/lib/supabase/server";
import { recordLeadEvent } from "@/lib/lead-events";

/**
 * Reconciles an anonymous visitor's carried-over prompt state onto their
 * now-authenticated account (ONBOARDING-FRICTION-SPEC.md #4): logs the run,
 * saves it as a named preset, and follows the referring creator. Every write
 * is independent and best-effort — one failing (e.g. a repeat call hitting
 * the preset's unique constraint) never blocks the others.
 */
export async function claimPendingState(
  promptId: string,
  values: Record<string, string>,
  creatorId: string | null
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await Promise.allSettled([
    supabase.from("prompt_runs").insert({ user_id: user.id, prompt_id: promptId, values }),
    supabase.from("prompt_presets").insert({
      user_id: user.id,
      prompt_id: promptId,
      name: "From when you saved this",
      values,
    }),
    creatorId && creatorId !== user.id
      ? supabase.from("follows").insert({ follower_id: user.id, following_id: creatorId })
      : Promise.resolve(),
    // Belt-and-suspenders with the /welcome short-circuit (CREATOR-ONBOARDING-
    // SPEC.md): a claimer is a client by default and must never see the
    // account-type picker, even if they somehow reach it before this runs.
    supabase.from("profiles").update({ account_type: "client" }).eq("id", user.id),
    // HOT-LEAD-HEAT-SPEC.md S1: the claim scores once. The bundled run/
    // preset/follow above are ALSO reported here (claim_bundle: true) so
    // record_lead_event still books its own ordinal/cap bookkeeping for
    // them — e.g. the next organic run correctly scores as a repeat, not a
    // first run — while scoring 0 themselves.
    recordLeadEvent(supabase, "claim", promptId, null, {}),
    recordLeadEvent(supabase, "prompt_run", promptId, null, { claim_bundle: true, values }),
    recordLeadEvent(supabase, "preset_saved", promptId, null, { claim_bundle: true }),
    creatorId && creatorId !== user.id
      ? recordLeadEvent(supabase, "follow", promptId, null, { claim_bundle: true })
      : Promise.resolve(),
  ]);
}
