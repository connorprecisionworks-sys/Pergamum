"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from "@/components/ui/sheet";
import { relativeTime } from "@/lib/utils";
import { STAGE_LABEL, STAGE_DOT, leadHandle, avatarColor, type SuggestedAction } from "./lead-format";
import { SendOfferButton } from "./send-offer-button";
import { MarkBookedButton } from "./mark-booked-button";

interface TimelineEvent {
  label: string;
  weight: number;
  createdAt: string;
}

interface LeadRowProps {
  userId: string;
  score: number;
  stage: string;
  updatedAt: string;
  sourceTitle: string | null;
  events: TimelineEvent[];
  suggestion: SuggestedAction | null;
  offerSlot: { id: string; label: string } | null;
  cooldownUntil: string | null;
}

export function LeadRow({
  userId,
  score,
  stage,
  updatedAt,
  sourceTitle,
  events,
  suggestion,
  offerSlot,
  cooldownUntil,
}: LeadRowProps) {
  const [open, setOpen] = useState(false);
  const handle = leadHandle(userId);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent/40"
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback style={{ backgroundColor: avatarColor(userId) }} className="text-[11px] font-medium">
              {handle.slice(-2)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{handle}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[stage] ?? "bg-foreground-subtle"}`} />
                {STAGE_LABEL[stage] ?? stage}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{Math.round(score)}</span>
              <span className="text-xs text-muted-foreground">· last active {relativeTime(updatedAt)}</span>
            </div>

            {sourceTitle && (
              <p className="mt-1 text-xs text-muted-foreground">
                Came from <span className="font-medium text-foreground">{sourceTitle}</span>
              </p>
            )}

            {events.length > 0 && (
              <ul className="mt-2.5 space-y-1 text-sm text-muted-foreground">
                {events.slice(0, 6).map((e, i) => (
                  <li key={i}>
                    {e.label} · {relativeTime(e.createdAt)}
                  </li>
                ))}
              </ul>
            )}

            {suggestion && (
              <div onClick={(e) => e.stopPropagation()}>
                {suggestion.href ? (
                  <Link
                    href={suggestion.href}
                    className="mt-3 block rounded-md bg-secondary/60 px-3 py-2 text-xs text-foreground underline-offset-2 hover:underline"
                  >
                    {suggestion.text}
                  </Link>
                ) : (
                  <p className="mt-3 rounded-md bg-secondary/60 px-3 py-2 text-xs text-foreground">
                    {suggestion.text}
                  </p>
                )}
              </div>
            )}

            <div onClick={(e) => e.stopPropagation()}>
              <SendOfferButton leadUserId={userId} offerSlot={offerSlot} cooldownUntil={cooldownUntil} />
            </div>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback style={{ backgroundColor: avatarColor(userId) }} className="text-xs font-medium">
                  {handle.slice(-2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle>{handle}</SheetTitle>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                    <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[stage] ?? "bg-foreground-subtle"}`} />
                    {STAGE_LABEL[stage] ?? stage}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">Score {Math.round(score)}</span>
                </div>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-6">
            <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Identity unlocks on Business when this lead consents.
            </div>

            {sourceTitle && (
              <p className="text-sm text-muted-foreground">
                Came from <span className="font-medium text-foreground">{sourceTitle}</span>
              </p>
            )}

            <div>
              <h3 className="mb-2 text-sm font-medium text-foreground">Why they&rsquo;re hot</h3>
              {events.length > 0 ? (
                <ul className="space-y-2">
                  {events.map((e, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-foreground">{e.label}</span>
                      <span className="shrink-0 text-right text-xs text-muted-foreground">
                        {e.weight > 0 ? `+${e.weight} pts · ` : ""}
                        {relativeTime(e.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
            </div>

            {suggestion && (
              <div>
                {suggestion.href ? (
                  <Link
                    href={suggestion.href}
                    className="block rounded-md bg-secondary/60 px-3 py-2 text-sm text-foreground underline-offset-2 hover:underline"
                  >
                    {suggestion.text}
                  </Link>
                ) : (
                  <p className="rounded-md bg-secondary/60 px-3 py-2 text-sm text-foreground">{suggestion.text}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <SendOfferButton
                leadUserId={userId}
                offerSlot={offerSlot}
                cooldownUntil={cooldownUntil}
                className="gap-1.5"
              />
              <MarkBookedButton leadUserId={userId} />
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
