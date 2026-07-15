"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markLeadBooked } from "./actions";

export function MarkBookedButton({ leadUserId }: { leadUserId: string }) {
  const [booked, setBooked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !booked;
    startTransition(async () => {
      const result = await markLeadBooked(leadUserId, next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBooked(next);
      toast.success(next ? "Marked as booked." : "Unmarked.");
    });
  };

  return (
    <Button
      type="button"
      variant={booked ? "secondary" : "outline"}
      size="sm"
      className="gap-1.5"
      onClick={toggle}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarCheck className="h-3.5 w-3.5" />}
      {booked ? "Booked" : "Mark as booked"}
    </Button>
  );
}
