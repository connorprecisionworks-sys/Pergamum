"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCount, cn } from "@/lib/utils";
import type { VoteValue } from "@/lib/types/database";

interface VoteButtonsProps {
  promptId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  currentVote: VoteValue | null;
}

export function VoteButtons({
  promptId,
  initialUpvotes,
  initialDownvotes,
  currentVote,
}: VoteButtonsProps) {
  const [vote, setVote] = useState<VoteValue | null>(currentVote);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [isPending, startTransition] = useTransition();

  const castVote = (value: VoteValue) => {
    startTransition(async () => {
      // Optimistic update
      const previousVote = vote;
      const previousUpvotes = upvotes;
      const previousDownvotes = downvotes;

      if (vote === value) {
        // Remove vote
        setVote(null);
        if (value === 1) setUpvotes((u) => Math.max(u - 1, 0));
        else setDownvotes((d) => Math.max(d - 1, 0));
      } else {
        // New or changed vote
        if (previousVote === 1) setUpvotes((u) => Math.max(u - 1, 0));
        if (previousVote === -1) setDownvotes((d) => Math.max(d - 1, 0));
        if (value === 1) setUpvotes((u) => u + 1);
        if (value === -1) setDownvotes((d) => d + 1);
        setVote(value);
      }

      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId, value }),
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
          toast.error("Sign in to vote on prompts.");
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
        aria-label={vote === 1 ? "Remove upvote" : "Upvote this prompt"}
        className={cn(
          "gap-1.5",
          vote === 1 &&
            "border-violet-400 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-400"
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
        aria-label={vote === -1 ? "Remove downvote" : "Downvote this prompt"}
        className={cn(
          "gap-1.5",
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
