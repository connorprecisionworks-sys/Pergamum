"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { recordLeadEvent } from "@/lib/lead-events";

interface OfferSlotCardProps {
  offerSlotId: string;
  promptId: string;
  currentUserId: string | null;
  label: string;
  url: string;
  description: string | null;
}

// Renders after a successful run — the peak-value moment (HOT-LEAD-HEAT-SPEC.md
// section 6). Anonymous visitors see and can click it too; the click always
// mirrors to analytics_events, but only scores in lead_events for an authed
// lead (the RPC has no session to resolve otherwise).
export function OfferSlotCard({
  offerSlotId,
  promptId,
  currentUserId,
  label,
  url,
  description,
}: OfferSlotCardProps) {
  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    void recordLeadEvent(supabase, "offer_view", promptId, null, { offer_slot_id: offerSlotId });
    // Fires once when the card first renders (i.e. once per revealing run).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    const supabase = createClient();
    if (currentUserId) {
      void recordLeadEvent(supabase, "offer_click", promptId, null, { offer_slot_id: offerSlotId });
    }
    // analytics_events table is not in generated types until migration runs
    // eslint-disable-next-line
    void (supabase as any).from("analytics_events").insert({
      event: "offer_click",
      user_id: currentUserId,
      props: { promptId, offerSlotId },
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-background-inset p-5">
      <p className="text-[11px] uppercase tracking-[0.1em] text-foreground-subtle">
        Want help with this?
      </p>
      <p className="mt-1.5 text-[15px] font-medium">{label}</p>
      {description && <p className="mt-1 text-sm text-foreground-muted">{description}</p>}
      <Button asChild className="mt-3.5 rounded-full">
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
          {label}
        </a>
      </Button>
    </div>
  );
}
