"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { recordLeadEvent } from "@/lib/lead-events";
import { useSharedFollowState } from "@/components/profile/follow-state";
import type { PackGating } from "@/lib/types/database";

/** Stashed just before a signed-out unlock sends the visitor through auth
 *  (email or Google) — read back on the fresh mount that follows, since
 *  neither auth path can carry app-specific state through by itself. */
const PENDING_FOLLOW_KEY = "prmpt:pending-follow";

interface GetPackButtonProps {
  packId: string;
  packTitle: string;
  gating: PackGating;
  priceCents: number;
  currentUserId: string | null;
  initiallySaved: boolean;
  initiallyFollowing: boolean;
  creatorId: string;
  creatorName: string;
  promptCount: number;
  returnTo: string;
}

export function GetPackButton({
  packId,
  packTitle,
  gating,
  priceCents,
  currentUserId,
  initiallySaved,
  initiallyFollowing,
  creatorId,
  creatorName,
  promptCount,
  returnTo,
}: GetPackButtonProps) {
  const [saved, setSaved] = useState(initiallySaved);
  const shared = useSharedFollowState();
  const [localFollowing, setLocalFollowing] = useState(initiallyFollowing);
  const following = shared ? shared.following : localFollowing;
  const setFollowing = shared ? shared.setFollowing : setLocalFollowing;
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isFollowerGate = gating === "follower";
  const done = isFollowerGate ? following : saved;
  const label =
    gating === "paid"
      ? `Get for $${(priceCents / 100).toFixed(0)}`
      : isFollowerGate
        ? "Follow to unlock"
        : "Get this pack";
  const doneLabel = isFollowerGate ? "Unlocked" : "In your library";

  // A completed auth round trip — email or Google — lands back on this page
  // with a fresh mount and a populated currentUserId (window.location.assign
  // from the auth hard-navigation fix, or the /auth/callback round trip).
  // Pick up the unlock intent stashed before auth started and finish the
  // follow here, uniformly for both auth paths.
  useEffect(() => {
    if (!isFollowerGate || !currentUserId || following) return;
    if (sessionStorage.getItem(PENDING_FOLLOW_KEY) !== creatorId) return;
    sessionStorage.removeItem(PENDING_FOLLOW_KEY);
    const supabase = createClient();
    supabase
      .from("follows")
      .insert({ follower_id: currentUserId, following_id: creatorId })
      .then(({ error }) => {
        if (error && error.code !== "23505") return;
        setFollowing(true);
        router.refresh();
      });
  }, [isFollowerGate, currentUserId, creatorId, following, router, setFollowing]);

  const handleClick = () => {
    if (gating === "paid") {
      setCheckoutOpen(true);
      return;
    }
    if (!currentUserId) {
      if (isFollowerGate) sessionStorage.setItem(PENDING_FOLLOW_KEY, creatorId);
      setAuthOpen(true);
      return;
    }
    if (isFollowerGate) {
      if (following) return;
      startTransition(async () => {
        const supabase = createClient();
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: creatorId });
        if (error && error.code !== "23505") {
          toast.error("Couldn't unlock this pack. Try again.");
          return;
        }
        setFollowing(true);
        toast.success(`Unlocked — you're following ${creatorName}.`);
        router.refresh();
      });
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
      void recordLeadEvent(supabase, "item_saved", null, packId, {});
    });
  };

  return (
    <>
      <Button size="lg" onClick={handleClick} disabled={isPending || done} className="gap-2">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="h-4 w-4" />
        ) : null}
        {done ? doneLabel : label}
      </Button>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isFollowerGate
                ? `Unlock all ${promptCount} prompt${promptCount === 1 ? "" : "s"} in ${packTitle}`
                : "Save this pack and we'll remember it."}
            </DialogTitle>
            <DialogDescription>
              {isFollowerGate
                ? `Follow ${creatorName} to unlock the full pack and keep it in your toolbox.`
                : "Create an account — or continue with Google."}
            </DialogDescription>
          </DialogHeader>
          <AuthForm mode="signup" returnTo={returnTo} oauthFirst={isFollowerGate} />
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
