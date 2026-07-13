import type { PackGating, PackItem } from "@/lib/types/database";

export function isEntitledToPack(isOwner: boolean, gating: PackGating, following: boolean): boolean {
  return isOwner || (gating === "follower" && following);
}

/**
 * A follower-gated pack must never be a full wall: if the creator hasn't
 * marked any item as a preview, the first item unlocks regardless so a cold
 * visitor always gets one usable prompt. Shared between the page (deciding
 * what content to send) and pack-detail (deciding what UI to show) so the
 * two can't drift out of sync.
 */
export function isPackItemLocked(
  gating: PackGating,
  item: Pick<PackItem, "is_preview">,
  index: number,
  hasPreviewItem: boolean,
  entitled: boolean,
  previewMode = false
): boolean {
  const forcedPreview = gating === "follower" && !hasPreviewItem && index === 0;
  if (forcedPreview) return false;
  return (gating === "paid" || gating === "follower") && !item.is_preview && (previewMode || !entitled);
}
