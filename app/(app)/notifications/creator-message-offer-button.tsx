"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface CreatorMessageOfferButtonProps {
  leadMessageId: string;
  label: string;
  url: string;
}

/** Mirrors offer-slot-card.tsx's click pattern: direct client write on
 *  click, idempotent via .is("clicked_at", null) so a second click never
 *  re-stamps. */
export function CreatorMessageOfferButton({ leadMessageId, label, url }: CreatorMessageOfferButtonProps) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    const supabase = createClient();
    void supabase
      .from("lead_messages")
      .update({ clicked_at: new Date().toISOString() })
      .eq("id", leadMessageId)
      .is("clicked_at", null);
  };

  return (
    <Button asChild size="sm" className="mt-2">
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        {label}
      </a>
    </Button>
  );
}
