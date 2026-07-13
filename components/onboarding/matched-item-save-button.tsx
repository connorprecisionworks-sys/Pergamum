"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { recordLeadEvent } from "@/lib/lead-events";
import { cn } from "@/lib/utils";

interface MatchedItemSaveButtonProps {
  kind: "prompt" | "pack";
  itemId: string;
  currentUserId: string;
  initiallySaved: boolean;
}

// Save/unsave toggle for a payoff-screen recommendation card. Writes straight
// to prompt_saves / pack_saves — same tables SavePromptButton and
// GetPackButton use — so anything saved here is already in /library the
// moment onboarding finishes. No navigation: this sits beside the card's
// Link, not inside it.
export function MatchedItemSaveButton({
  kind,
  itemId,
  currentUserId,
  initiallySaved,
}: MatchedItemSaveButtonProps) {
  const [saved, setSaved] = useState(initiallySaved);
  const [isPending, startTransition] = useTransition();

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const supabase = createClient();
      if (kind === "prompt") {
        if (saved) {
          const { error } = await supabase
            .from("prompt_saves")
            .delete()
            .eq("user_id", currentUserId)
            .eq("prompt_id", itemId);
          if (error) return;
        } else {
          const { error } = await supabase
            .from("prompt_saves")
            .insert({ user_id: currentUserId, prompt_id: itemId });
          if (error && error.code !== "23505") return;
          void recordLeadEvent(supabase, "item_saved", itemId, null, {});
        }
      } else {
        if (saved) {
          const { error } = await supabase
            .from("pack_saves")
            .delete()
            .eq("user_id", currentUserId)
            .eq("pack_id", itemId);
          if (error) return;
        } else {
          const { error } = await supabase
            .from("pack_saves")
            .insert({ user_id: currentUserId, pack_id: itemId });
          if (error && error.code !== "23505") return;
          void recordLeadEvent(supabase, "item_saved", null, itemId, {});
        }
      }
      setSaved(!saved);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={saved}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors",
        saved
          ? "border-transparent bg-primary/10 text-primary"
          : "border-border-strong text-foreground-muted hover:border-foreground hover:text-foreground",
      )}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="h-3 w-3" />
      ) : (
        <Bookmark className="h-3 w-3" />
      )}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
