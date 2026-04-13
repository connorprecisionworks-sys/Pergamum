"use client";

import { useState, useTransition } from "react";
import { BookmarkPlus, Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Collection } from "@/lib/types/database";

interface AddToCollectionButtonProps {
  promptId: string;
  currentUserId: string | null;
  /** Collections that already contain this prompt (for showing check state) */
  initialContaining?: string[];
}

export function AddToCollectionButton({
  promptId,
  currentUserId,
  initialContaining = [],
}: AddToCollectionButtonProps) {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [containing, setContaining] = useState<Set<string>>(new Set(initialContaining));
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const loadCollections = async () => {
    if (collections !== null) return; // already loaded
    const { data } = await supabase
      .from("collections")
      .select("*")
      .eq("owner_id", currentUserId!)
      .order("created_at", { ascending: false });
    setCollections(data ?? []);
  };

  const toggle = (collectionId: string) => {
    if (!currentUserId) return;
    setLoadingId(collectionId);
    startTransition(async () => {
      if (containing.has(collectionId)) {
        await supabase
          .from("collection_prompts")
          .delete()
          .eq("collection_id", collectionId)
          .eq("prompt_id", promptId);
        setContaining((prev) => { const next = new Set(prev); next.delete(collectionId); return next; });
        toast.success("Removed from collection.");
      } else {
        const { data: existing } = await supabase
          .from("collection_prompts")
          .select("sort_order")
          .eq("collection_id", collectionId)
          .order("sort_order", { ascending: false })
          .limit(1)
          .single();
        const nextOrder = (existing?.sort_order ?? -1) + 1;
        await supabase
          .from("collection_prompts")
          .insert({ collection_id: collectionId, prompt_id: promptId, sort_order: nextOrder });
        setContaining((prev) => new Set([...prev, collectionId]));
        toast.success("Added to collection.");
      }
      setLoadingId(null);
    });
  };

  if (!currentUserId) return null;

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) loadCollections(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BookmarkPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Add to collection</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {collections === null ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : collections.length === 0 ? (
          <div className="py-3 px-2 text-sm text-muted-foreground text-center">
            No collections yet.
          </div>
        ) : (
          collections.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => toggle(c.id)}
              disabled={loadingId === c.id || isPending}
              className="justify-between"
            >
              <span className="truncate">{c.title}</span>
              {loadingId === c.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : containing.has(c.id) ? (
                <Check className="h-3.5 w-3.5 text-pergamum-600 shrink-0" />
              ) : null}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/dashboard/collections?new=1" className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            New collection
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
