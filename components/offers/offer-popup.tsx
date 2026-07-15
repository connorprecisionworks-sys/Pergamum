"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { recordLeadEvent } from "@/lib/lead-events";
import { cn } from "@/lib/utils";

interface OfferPopupProps {
  offerSlotId: string;
  /** Exactly one of promptId/packId identifies where this offer surfaced. */
  promptId: string | null;
  packId: string | null;
  creatorId: string;
  currentUserId: string | null;
  creatorName: string;
  creatorAvatarUrl: string | null;
  title: string | null;
  label: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
}

function dismissKey(creatorId: string, promptId: string | null, packId: string | null): string {
  return `prmpt:offer-dismissed:${creatorId}:${promptId ?? packId ?? "default"}`;
}

/**
 * Slide-in popup that appears after a successful run (the peak-value moment —
 * HOT-LEAD-HEAT-SPEC.md section 6). Anonymous visitors see and can click it
 * too; the click always mirrors to analytics_events, but only scores in
 * lead_events for an authed lead (the RPC has no session to resolve
 * otherwise). Dismissing hides it for the rest of the browser session via
 * sessionStorage, keyed per creator + prompt/pack so it doesn't re-nag on
 * the next page but still shows fresh elsewhere.
 */
export function OfferPopup({
  offerSlotId,
  promptId,
  packId,
  creatorId,
  currentUserId,
  creatorName,
  creatorAvatarUrl,
  title,
  label,
  url,
  description,
  imageUrl,
}: OfferPopupProps) {
  const key = dismissKey(creatorId, promptId, packId);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(key) === "1";
  });
  const [entered, setEntered] = useState(false);

  // Slide in on the frame after mount rather than at mount, so the browser
  // paints the off-screen position first and the transform transition has
  // something to animate from.
  useEffect(() => {
    if (dismissed) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dismissed || !currentUserId) return;
    const supabase = createClient();
    void recordLeadEvent(supabase, "offer_view", promptId, packId, { offer_slot_id: offerSlotId });
    // Fires once when the popup first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(key, "1");
    setEntered(false);
    setTimeout(() => setDismissed(true), 300);
  };

  const handleClick = () => {
    const supabase = createClient();
    if (currentUserId) {
      void recordLeadEvent(supabase, "offer_click", promptId, packId, { offer_slot_id: offerSlotId });
    }
    // analytics_events table is not in generated types until migration runs
    // eslint-disable-next-line
    void (supabase as any).from("analytics_events").insert({
      event: "offer_click",
      user_id: currentUserId,
      props: { promptId, packId, offerSlotId },
    });
  };

  if (dismissed) return null;

  return (
    <div
      role="dialog"
      aria-label={title ?? label}
      style={{ transitionDuration: "600ms" }}
      className={cn(
        "fixed bottom-6 right-6 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(28,30,40,0.20)] transition-transform ease-out",
        entered ? "translate-x-0" : "translate-x-[calc(100%+1.5rem)]"
      )}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-1 text-foreground-subtle transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-36 w-full object-cover" />
      )}

      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={creatorAvatarUrl ?? undefined} alt={creatorName} />
            <AvatarFallback className="bg-secondary text-[9px] text-foreground-muted">
              {creatorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[13px] text-foreground-muted">{creatorName}</span>
        </div>

        <p className="text-[15px] font-medium leading-snug">{title ?? "Want help with this?"}</p>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{description}</p>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {label}
        </a>

        <button
          type="button"
          onClick={dismiss}
          className="mt-2.5 block w-full text-center text-[13px] text-foreground-subtle underline underline-offset-2 hover:text-foreground"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
