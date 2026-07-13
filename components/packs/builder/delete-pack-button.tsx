"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { deletePack } from "@/app/(app)/dashboard/packs/actions";

export function DeletePackButton({ packId, packTitle }: { packId: string; packTitle: string }) {
  const [isPending, startTransition] = useTransition();
  const [gone, setGone] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (gone) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const r = await deletePack(packId);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      setConfirmOpen(false);
      setGone(true);
      toast.success("Pack deleted.");
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        aria-label="Delete pack"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${packTitle}"?`}
        description="This can't be undone."
        confirmLabel="Delete"
        loading={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
