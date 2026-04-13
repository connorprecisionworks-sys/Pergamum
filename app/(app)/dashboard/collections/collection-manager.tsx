"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2, Globe, Lock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createCollection, deleteCollection } from "./actions";
import type { Collection } from "@/lib/types/database";

const COVER_COLORS = ["zinc", "pergamum", "amber", "emerald", "blue", "rose"] as const;
const COLOR_SWATCH: Record<string, string> = {
  zinc: "bg-zinc-300",
  pergamum: "bg-pergamum-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  blue: "bg-blue-400",
  rose: "bg-rose-400",
};

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      Create collection
    </Button>
  );
}

interface CollectionManagerProps {
  collections: Collection[];
  ownerUsername: string;
  openNew?: boolean;
}

export function CollectionManager({ collections: initial, ownerUsername, openNew }: CollectionManagerProps) {
  const [collections, setCollections] = useState(initial);
  const [state, action] = useFormState(createCollection, {} as { error?: string; success?: boolean });
  const [dialogOpen, setDialogOpen] = useState(openNew ?? false);
  const [selectedColor, setSelectedColor] = useState<string>("zinc");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (state?.success && dialogOpen) {
    setDialogOpen(false);
    toast.success("Collection created.");
    state.success = false;
  }

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteCollection(id);
      if (result.error) { toast.error(result.error); }
      else {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        toast.success("Collection deleted.");
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{collections.length} collection{collections.length !== 1 ? "s" : ""}</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create collection</DialogTitle>
            </DialogHeader>
            <form action={action} className="space-y-4 pt-2">
              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="col-title">Title</Label>
                <Input id="col-title" name="title" placeholder="My Favourite Prompts" required minLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="col-desc">Description (optional)</Label>
                <Textarea id="col-desc" name="description" rows={2} placeholder="What's in this collection?" />
              </div>
              <div className="space-y-1.5">
                <Label>Colour</Label>
                <div className="flex gap-2">
                  {COVER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full ${COLOR_SWATCH[color]} ring-offset-2 transition-all ${selectedColor === color ? "ring-2 ring-pergamum-500" : ""}`}
                      aria-label={color}
                    />
                  ))}
                </div>
                <input type="hidden" name="cover_color" value={selectedColor} />
              </div>
              <div className="flex items-center gap-2">
                <input type="hidden" name="is_public" value="true" />
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Public by default — edit to change
                </Label>
              </div>
              <CreateButton />
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No collections yet. Create one to start curating.
        </p>
      ) : (
        <div className="space-y-2">
          {collections.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-8 rounded-full ${COLOR_SWATCH[c.cover_color] ?? "bg-zinc-300"}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{c.title}</span>
                    {c.is_public ? (
                      <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                    ) : (
                      <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/collections/${ownerUsername}/${c.slug}`} target="_blank" aria-label="View">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id || isPending}
                  aria-label="Delete collection"
                >
                  {deletingId === c.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
