"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useSharedFollowState } from "@/components/profile/follow-state";
import { recordLeadEvent } from "@/lib/lead-events";

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string | null;
  initiallyFollowing: boolean;
  onFollowerCountChange?: (delta: number) => void;
}

export function FollowButton({
  targetUserId,
  currentUserId,
  initiallyFollowing,
  onFollowerCountChange,
}: FollowButtonProps) {
  const shared = useSharedFollowState();
  const [localFollowing, setLocalFollowing] = useState(initiallyFollowing);
  const following = shared ? shared.following : localFollowing;
  const setFollowing = shared ? shared.setFollowing : setLocalFollowing;
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  if (!currentUserId || currentUserId === targetUserId) return null;

  const toggle = () => {
    startTransition(async () => {
      if (following) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);
        if (error) { toast.error("Couldn't unfollow."); return; }
        setFollowing(false);
        onFollowerCountChange?.(-1);
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        if (error) { toast.error("Couldn't follow."); return; }
        setFollowing(true);
        onFollowerCountChange?.(1);
        void recordLeadEvent(supabase, "follow", null, null, {}, targetUserId);
      }
    });
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={toggle}
      disabled={isPending}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : following ? (
        <UserMinus className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
