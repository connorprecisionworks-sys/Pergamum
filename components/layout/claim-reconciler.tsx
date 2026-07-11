"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { readPendingClaim, clearPendingClaim } from "@/lib/anon-claim";
import { claimPendingState } from "@/lib/claim";

/**
 * Frictionless claim flow: on the first authenticated render after a signed-out
 * visitor claimed a prompt, reconcile their carried-over state.
 *
 * This lived inside <Header/>, which the app shell no longer renders. It is
 * behaviour, not chrome, so it is extracted rather than dropped. The marketing
 * group still gets it via <Header/>.
 */
export function ClaimReconciler({ profileId }: { profileId?: string }) {
  useEffect(() => {
    if (!profileId) return;
    const pending = readPendingClaim();
    if (!pending) return;
    clearPendingClaim();
    claimPendingState(pending.promptId, pending.values, pending.creatorId)
      .then(() => {
        toast.success("Saved to your library — we remembered what you typed.");
      })
      .catch(() => {
        // Best-effort — a failed reconciliation shouldn't surface as an error.
      });
  }, [profileId]);

  return null;
}
