"use client";

import { Separator } from "@/components/ui/separator";
import { OfferSlotCard } from "@/components/prompts/offer-slot-card";
import { usePackRunState } from "@/components/packs/pack-run-state";

interface PackOfferSlotProps {
  offerSlot: { id: string; label: string; url: string; description: string | null };
  packId: string;
  currentUserId: string | null;
}

/** Mirrors prompt-detail's offer reveal, gated on a pack-level hasRun
 *  instead of a single prompt's — shows once any track has been run. */
export function PackOfferSlot({ offerSlot, packId, currentUserId }: PackOfferSlotProps) {
  const { hasRun } = usePackRunState();
  if (!hasRun) return null;

  return (
    <>
      <Separator />
      <OfferSlotCard
        offerSlotId={offerSlot.id}
        promptId={null}
        packId={packId}
        currentUserId={currentUserId}
        label={offerSlot.label}
        url={offerSlot.url}
        description={offerSlot.description}
      />
    </>
  );
}
