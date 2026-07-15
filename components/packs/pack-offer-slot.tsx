"use client";

import { OfferPopup } from "@/components/offers/offer-popup";
import { usePackRunState } from "@/components/packs/pack-run-state";

interface PackOfferSlotProps {
  offerSlot: {
    id: string;
    title: string | null;
    label: string;
    url: string;
    description: string | null;
    image_url: string | null;
  };
  packId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl: string | null;
  currentUserId: string | null;
}

/** Mirrors prompt-detail's offer reveal, gated on a pack-level hasRun
 *  instead of a single prompt's — shows once any track has been run. */
export function PackOfferSlot({
  offerSlot,
  packId,
  creatorId,
  creatorName,
  creatorAvatarUrl,
  currentUserId,
}: PackOfferSlotProps) {
  const { hasRun } = usePackRunState();
  if (!hasRun) return null;

  return (
    <OfferPopup
      offerSlotId={offerSlot.id}
      promptId={null}
      packId={packId}
      creatorId={creatorId}
      currentUserId={currentUserId}
      creatorName={creatorName}
      creatorAvatarUrl={creatorAvatarUrl}
      title={offerSlot.title}
      label={offerSlot.label}
      url={offerSlot.url}
      description={offerSlot.description}
      imageUrl={offerSlot.image_url}
    />
  );
}
