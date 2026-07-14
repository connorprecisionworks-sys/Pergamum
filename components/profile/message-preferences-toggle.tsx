"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMessagePreferences } from "@/app/(app)/dashboard/profile/actions";
import { cn } from "@/lib/utils";

interface MessagePreferencesToggleProps {
  initialOptOut: boolean;
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        on ? "bg-primary" : "bg-border-strong"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function MessagePreferencesToggle({ initialOptOut }: MessagePreferencesToggleProps) {
  const [receiveOffers, setReceiveOffers] = useState(!initialOptOut);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !receiveOffers;
    setReceiveOffers(next);
    startTransition(async () => {
      const result = await updateMessagePreferences(!next);
      if (result.error) {
        setReceiveOffers(!next);
        toast.error("Couldn't save that. Try again.");
        return;
      }
      toast.success("Saved.");
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-4">
      <div>
        <p className="text-sm font-medium">Receive offers from creators you&apos;ve used</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Lets a creator send their offer to you through Prmpt. They never see your email or identity.
        </p>
      </div>
      <Toggle on={receiveOffers} onToggle={toggle} disabled={isPending} />
    </div>
  );
}
