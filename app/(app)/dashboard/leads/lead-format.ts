export interface LeadEvent {
  event_type: string;
  weight: number;
  prompt_id: string | null;
  pack_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface SuggestedAction {
  text: string;
  href?: string;
}

export const STAGE_LABEL: Record<string, string> = { hot: "Hot", warm: "Warm", cold: "Cold" };
export const STAGE_DOT: Record<string, string> = {
  hot: "bg-destructive",
  warm: "bg-amber-500",
  cold: "bg-foreground-subtle",
};

export function leadHandle(userId: string): string {
  return `Lead #${userId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** "Title · Company" — either half may be absent (business-identity-only consent has both, but not always a name). */
export function identityLine(title: string | null, company: string | null): string | null {
  if (title && company) return `${title} · ${company}`;
  return title || company || null;
}

/** Initials from a real name, for the avatar fallback once identity is unlocked. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Deterministic HSL from the user id — a stable "generated avatar" with no external service. */
export function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360}, 55%, 88%)`;
}

export function eventLabel(event: LeadEvent, titles: Map<string, string>): string {
  const promptTitle = event.prompt_id ? titles.get(`prompt:${event.prompt_id}`) : null;
  const packTitle = event.pack_id ? titles.get(`pack:${event.pack_id}`) : null;

  switch (event.event_type) {
    case "claim":
      return promptTitle ? `Claimed "${promptTitle}"` : "Claimed your link";
    case "prompt_run": {
      const filled = typeof event.meta?.vars_filled_pct === "number" && event.meta.vars_filled_pct >= 80;
      const base = promptTitle ? `Ran "${promptTitle}"` : "Ran a prompt";
      return filled ? `${base} with real inputs` : base;
    }
    case "preset_saved":
      return promptTitle ? `Saved a preset for "${promptTitle}"` : "Saved a preset";
    case "item_saved":
      return promptTitle ? `Saved "${promptTitle}"` : packTitle ? `Saved "${packTitle}"` : "Saved an item";
    case "follow":
      return "Followed you";
    case "return_visit":
      return "Came back on a new day";
    case "pack_completed":
      return packTitle ? `Completed "${packTitle}"` : "Completed a pack";
    case "velocity_bonus":
      return "Ran it within minutes of claiming";
    case "offer_view":
      return "Saw your offer button";
    case "offer_click":
      return "Clicked your offer button";
    default:
      return event.event_type;
  }
}

export function suggestedAction(
  stage: string,
  hasOfferClick: boolean,
  hasAnyOfferSlot: boolean
): SuggestedAction | null {
  if (hasOfferClick) return { text: "They clicked your offer button. Follow up on the booking." };
  if (stage === "hot" && hasAnyOfferSlot) {
    return { text: "Hot and hasn't clicked your offer yet. Consider a direct nudge in your next post." };
  }
  if (stage === "hot" && !hasAnyOfferSlot) {
    return { text: "Add an offer slot. This lead has nowhere to say yes.", href: "/dashboard/offers" };
  }
  if (stage === "warm") return { text: "Watch. An alert fires if they return." };
  return null;
}
