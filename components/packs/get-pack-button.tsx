"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/auth-form";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { PackGating } from "@/lib/types/database";

interface GetPackButtonProps {
  packId: string;
  packTitle: string;
  gating: PackGating;
  priceCents: number;
  currentUserId: string | null;
  initiallySaved: boolean;
  returnTo: string;
}

export function GetPackButton({
  packId,
  packTitle,
  gating,
  priceCents,
  currentUserId,
  initiallySaved,
  returnTo,
}: GetPackButtonProps) {
  const [saved, setSaved] = useState(initiallySaved);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const label =
    gating === "paid" ? `Get for $${(priceCents / 100).toFixed(0)}` : "Get this pack";

  const handleClick = () => {
    if (gating === "paid") {
      setCheckoutOpen(true);
      return;
    }
    if (!currentUserId) {
      setAuthOpen(true);
      return;
    }
    if (saved) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("pack_saves")
        .insert({ user_id: currentUserId, pack_id: packId });
      if (error && error.code !== "23505") {
        toast.error("Couldn't save this pack. Try again.");
        return;
      }
      setSaved(true);
      toast.success("Saved to your library.");
    });
  };

  return (
    <>
      <Button size="lg" onClick={handleClick} disabled={isPending || saved} className="gap-2">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : null}
        {saved ? "In your library" : label}
      </Button>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save this pack and we&apos;ll remember it.</DialogTitle>
            <DialogDescription>One tap — no password, nothing to fill in.</DialogDescription>
          </DialogHeader>
          <AuthForm mode="signup" returnTo={returnTo} />
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Checkout coming soon</DialogTitle>
            <DialogDescription>
              Paid packs aren&apos;t live yet. &ldquo;{packTitle}&rdquo; will be purchasable here
              once checkout ships.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
