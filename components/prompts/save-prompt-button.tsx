"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { recordLeadEvent } from "@/lib/lead-events";

interface SavePromptButtonProps {
  promptId: string;
  currentUserId: string;
  initiallySaved: boolean;
}

// Single-prompt bookmark — the "Singles" shelf in /library. Separate from
// AddToCollectionButton (organizing into named collections): this is the
// zero-effort "keep this" action, one tap, no picking a collection first.
export function SavePromptButton({ promptId, currentUserId, initiallySaved }: SavePromptButtonProps) {
  const [saved, setSaved] = useState(initiallySaved);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const supabase = createClient();
      if (saved) {
        const { error } = await supabase
          .from("prompt_saves")
          .delete()
          .eq("user_id", currentUserId)
          .eq("prompt_id", promptId);
        if (error) {
          toast.error("Couldn't remove from your library.");
          return;
        }
        setSaved(false);
      } else {
        const { error } = await supabase
          .from("prompt_saves")
          .insert({ user_id: currentUserId, prompt_id: promptId });
        if (error && error.code !== "23505") {
          toast.error("Couldn't save to your library.");
          return;
        }
        setSaved(true);
        toast.success("Saved to your library.");
        void recordLeadEvent(supabase, "item_saved", promptId, null, {});
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={isPending} className="gap-1.5">
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
