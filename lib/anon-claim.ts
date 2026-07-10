// Anonymous-use carryover for the frictionless claim flow (ONBOARDING-FRICTION-SPEC.md).
// A signed-out visitor's in-progress prompt state — which prompt, what they
// typed, who sent them — survives the auth redirect via localStorage, keyed
// by a single fixed key since only one claim can be pending at a time.

const KEY = "pk_pending_claim";

export interface PendingClaim {
  promptId: string;
  values: Record<string, string>;
  creatorId: string | null;
  savedAt: string;
}

export function savePendingClaim(
  promptId: string,
  values: Record<string, string>,
  creatorId: string | null
): void {
  if (typeof window === "undefined") return;
  try {
    const claim: PendingClaim = { promptId, values, creatorId, savedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(claim));
  } catch {
    // Private browsing / storage full — losing the carryover is non-critical.
  }
}

export function readPendingClaim(): PendingClaim | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingClaim) : null;
  } catch {
    return null;
  }
}

export function clearPendingClaim(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore — nothing to clean up if storage is unavailable.
  }
}
