"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCount, cn } from "@/lib/utils";
import type { VoteValue } from "@/lib/types/database";

interface SkillVoteButtonsProps {
  skillId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  currentVote: VoteValue | null;
}

/**
 * Vote buttons for skills. Mirrors the prompt VoteButtons but posts to
 * /api/skills/vote and tracks counts on the skill row.
 */
export function SkillVoteButtons({
  skillId,
  initialUpvotes,
  initialDownvotes,
  currentVote,
}: SkillVoteButtonsProps) {
  const [vote, setVote] = useState<VoteValue | null>(currentVote);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [isPending, startTransition] = useTransition();

  const castVote = (value: VoteValue) => {
    startTransition(async () => {
      const previousVote = vote;
      const previousUpvotes = upvotes;
      const previousDownvotes = downvotes;

      if (vote === value) {
        setVote(null);
        if (value === 1) setUpvotes((u) => Math.max(u - 1, 0));
        else setDownvotes((d) => Math.max(d - 1, 0));
      } else {
        if (previousVote === 1) setUpvotes((u) => Math.max(u - 1, 0));
        if (previousVote === -1) setDownvotes((d) => Math.max(d - 1, 0));
        if (value === 1) setUpvotes((u) => u + 1);
        if (value === -1) setDownvotes((d) => d + 1);
        setVote(value);
      }

      try {
        const res = await fetch("/api/skills/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skillId, value }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Vote failed");
        }
      } catch (err) {
        // Rollback
        setVote(previousVote);
        setUpvotes(previousUpvotes);
        setDownvotes(previousDownvotes);
        const msg = err instanceof Error ? err.message : "Vote failed";
        if (msg.includes("auth") || msg.includes("sign")) {
          toast.error("Sign in to vote on skills.");
        } else {
          toast.error(msg);
        }
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => castVote(1)}
        disabled={isPending}
        aria-label={vote === 1 ? "Remove upvote" : "Upvote this skill"}
        aria-pressed={vote === 1}
        className={cn(
          "gap-1.5 min-h-[44px]",
          vote === 1 &&
            "border-brand-400 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
        )}
      >
        <ThumbsUp className="h-4 w-4" />
        <span>{formatCount(upvotes)}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => castVote(-1)}
        disabled={isPending}
        aria-label={vote === -1 ? "Remove downvote" : "Downvote this skill"}
        aria-pressed={vote === -1}
        className={cn(
          "gap-1.5 min-h-[44px]",
          vote === -1 &&
            "border-red-400 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
        )}
      >
        <ThumbsDown className="h-4 w-4" />
        <span>{formatCount(downvotes)}</span>
      </Button>
    </div>
  );
}
