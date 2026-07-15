"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sendLeadMessage } from "./actions";

interface SendOfferButtonProps {
  leadUserId: string;
  offerSlot: { id: string; label: string } | null;
  /** ISO timestamp 24h after the last send to this lead, if still within cooldown. */
  cooldownUntil: string | null;
  /** Defaults to a top margin for the list-row layout; pass "" inside a button row. */
  className?: string;
}

function hoursRemaining(untilIso: string): number {
  return Math.max(1, Math.ceil((new Date(untilIso).getTime() - Date.now()) / (60 * 60 * 1000)));
}

export function SendOfferButton({
  leadUserId,
  offerSlot,
  cooldownUntil,
  className = "mt-3 gap-1.5",
}: SendOfferButtonProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!offerSlot) {
    return (
      <Link
        href="/dashboard/offers"
        className={`${className} block rounded-md bg-secondary/60 px-3 py-2 text-xs text-foreground underline-offset-2 hover:underline`}
      >
        Set an offer slot to send this lead something.
      </Link>
    );
  }

  const onCooldown = !!cooldownUntil && new Date(cooldownUntil).getTime() > Date.now();

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendLeadMessage(leadUserId, offerSlot.id, note.trim() || null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      toast.success("Sent.");
      setTimeout(() => setOpen(false), 900);
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => {
          setSent(false);
          setNote("");
          setOpen(true);
        }}
        disabled={onCooldown}
      >
        <Send className="h-3.5 w-3.5" />
        {onCooldown ? `Sent · next in ${hoursRemaining(cooldownUntil!)}h` : "Send offer"}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) setOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Send your offer</DialogTitle>
            <DialogDescription>
              Delivered through Prmpt — you won&apos;t see who this lead is unless they respond.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Offer</p>
              <p className="text-sm font-medium">{offerSlot.label}</p>
            </div>
            <Textarea
              placeholder="Optional short note (e.g. &quot;Saw you ran this a few times — happy to help.&quot;)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isPending || sent}
              rows={3}
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSend} disabled={isPending || sent}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : sent ? (
                <Check className="h-4 w-4" />
              ) : null}
              {sent ? "Sent" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
