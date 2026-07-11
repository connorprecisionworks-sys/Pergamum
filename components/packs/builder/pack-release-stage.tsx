"use client";

import { useState, useTransition } from "react";
import { Check, Circle, Copy, Loader2, Rocket, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { releasePack } from "@/app/(app)/dashboard/packs/actions";
import { cn } from "@/lib/utils";
import type { Pack, PackGating, PackItemWithContent, PackVersion } from "@/lib/types/database";

interface PackReleaseStageProps {
  pack: Pack;
  items: PackItemWithContent[];
  versions: PackVersion[];
  creatorUsername: string;
  onGatingChange: (patch: { gating?: PackGating; price_cents?: number }) => void;
  onItemPreviewToggle: (itemId: string, isPreview: boolean) => void;
  onReleased: (patch: Partial<Pack>, newVersion?: PackVersion) => void;
  onJumpToStage: (stage: "contents" | "cover") => void;
}

const GATING_OPTIONS: { value: PackGating; label: string; description: string }[] = [
  { value: "free", label: "Free", description: "One tap saves the whole pack." },
  { value: "paid", label: "Paid", description: "Set a price and choose preview rows." },
  { value: "follower", label: "Follower-gated", description: "Free, but only for followers." },
];

export function PackReleaseStage({
  pack,
  items,
  versions,
  creatorUsername,
  onGatingChange,
  onItemPreviewToggle,
  onReleased,
  onJumpToStage,
}: PackReleaseStageProps) {
  const [isPending, startTransition] = useTransition();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [changelog, setChangelog] = useState("");

  const isPublished = pack.status === "published";
  const funnelUrl =
    typeof window !== "undefined" ? `${window.location.origin}/packs/${creatorUsername}/${pack.slug}?via=dm` : "";
  const dmSnippet = `Here's the pack — ${pack.title}: ${funnelUrl}`;

  const checklist: {
    label: string;
    hint: string;
    ok: boolean;
    stage: "contents" | "cover" | null;
    /** DOM id to focus when "Fix" is clicked, for fields outside the stage panes. */
    focusId?: string;
  }[] = [
    {
      label: "Pack has a title",
      hint: "It's the first thing a saver reads, and it names the link you send.",
      ok: pack.title.trim().length > 1 && pack.title !== "Untitled pack",
      stage: "contents",
      focusId: "pack-title",
    },
    {
      label: "At least one track added",
      hint: "A pack delivers prompts or skills — there has to be something inside.",
      ok: items.length > 0,
      stage: "contents",
    },
    {
      label: "Every track has a promise line",
      hint: "One line per track telling someone what they get from running it.",
      ok: items.every((i) => !!i.promise_line?.trim()),
      stage: "contents",
    },
    ...(pack.gating === "paid"
      ? [
          {
            label: "Price is set",
            hint: "A paid pack can't go out at $0. Set it under Gating above.",
            ok: pack.price_cents > 0,
            stage: null,
          },
          {
            label: "At least one preview track picked",
            hint: "Buyers need to see something real before they pay.",
            ok: items.some((i) => i.is_preview),
            stage: null,
          },
        ]
      : []),
  ];
  const checklistPassed = checklist.every((c) => c.ok);

  /** Jump to the stage that owns the failing item, then put the cursor on it. */
  const handleFix = (stage: "contents" | "cover" | null, focusId?: string) => {
    if (stage) onJumpToStage(stage);
    if (!focusId) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(focusId);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus();
    });
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(dmSnippet);
      toast.success("Snippet copied.");
    } catch {
      toast.error("Couldn't copy.");
    }
  };

  const notifyFanOut = (type: "pack_released" | "pack_updated") => {
    void fetch("/api/packs/notify-release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId: pack.id, type }),
    }).catch(() => {});
  };

  const handleRelease = () => {
    if (!checklistPassed) {
      toast.error("Fix the checklist items below before releasing.");
      return;
    }
    startTransition(async () => {
      const r = await releasePack(pack.id);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      onReleased({ status: "published", released_at: new Date().toISOString() });
      notifyFanOut("pack_released");
      toast.success("Your pack is live.");
    });
  };

  const handlePushUpdate = () => {
    if (!changelog.trim()) {
      toast.error("A one-line changelog is required.");
      return;
    }
    startTransition(async () => {
      const r = await releasePack(pack.id, changelog);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      const nextVersion = pack.version + 1;
      onReleased(
        { version: nextVersion },
        { id: `local-${nextVersion}`, pack_id: pack.id, version: nextVersion, changelog: changelog.trim(), created_at: new Date().toISOString() }
      );
      notifyFanOut("pack_updated");
      setChangelogOpen(false);
      setChangelog("");
      toast.success(`Pushed v${nextVersion} — savers and followers notified.`);
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-3">Gating</h3>
        <div className="space-y-2">
          {GATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onGatingChange({ gating: opt.value })}
              className={cn(
                "w-full text-left p-3 rounded-md border transition-colors",
                pack.gating === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-background-subtle/50"
              )}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>

        {pack.gating === "paid" && (
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5 max-w-[160px]">
              <Label htmlFor="price" className="text-xs">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                min={1}
                value={pack.price_cents ? (pack.price_cents / 100).toString() : ""}
                onChange={(e) => onGatingChange({ price_cents: Math.round(Number(e.target.value || 0) * 100) })}
                placeholder="29"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preview tracks (visible before paying)</Label>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.is_preview}
                      onChange={(e) => onItemPreviewToggle(item.id, e.target.checked)}
                    />
                    {item.item_type === "prompt" ? item.prompts?.title : item.skills?.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-1.5">Publish checklist</h3>
        <p className="text-xs text-foreground-muted mb-3">
          Every item has to pass before the pack can go out — this is what a saver sees on day one.
        </p>
        <div className="space-y-3">
          {checklist.map((c) => (
            <div key={c.label} className="flex items-start justify-between gap-2 text-sm">
              <span className="flex items-start gap-2">
                {c.ok ? (
                  <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-foreground-subtle mt-0.5 shrink-0" />
                )}
                <span>
                  <span className={cn("block", c.ok ? "text-foreground" : "text-foreground-muted")}>{c.label}</span>
                  <span className="block text-xs text-foreground-subtle mt-0.5">{c.hint}</span>
                </span>
              </span>
              {!c.ok && (c.stage || c.focusId) && (
                <button
                  type="button"
                  onClick={() => handleFix(c.stage, c.focusId)}
                  className="text-xs text-foreground-subtle hover:text-foreground underline underline-offset-2 shrink-0"
                >
                  Fix
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {!isPublished ? (
          <div className="flex items-center gap-2">
            <Button onClick={handleRelease} disabled={isPending || !checklistPassed} className="gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Release now
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="outline" disabled>Schedule drop</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Coming soon — needs a scheduling job.</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setChangelogOpen(true)} className="gap-2">
            Edit &amp; push v{pack.version + 1}
          </Button>
        )}
      </div>

      {isPublished && (
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-2">
            Your drop is live — send this
          </h3>
          <div className="border border-border rounded-md p-3 space-y-2 bg-background-inset">
            <p className="text-xs font-mono break-all text-foreground-muted">{funnelUrl}</p>
            <p className="text-sm">{dmSnippet}</p>
            <Button variant="outline" size="sm" onClick={copySnippet} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Copy DM snippet
            </Button>
          </div>
          {versions.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {versions.map((v) => (
                <p key={v.id} className="text-xs text-foreground-muted">
                  <span className="font-mono text-foreground-subtle">v{v.version}</span> — {v.changelog}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={changelogOpen} onOpenChange={setChangelogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Push v{pack.version + 1}</DialogTitle>
            <DialogDescription>One line — what changed. Savers and followers get notified.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            rows={3}
            placeholder="Added an objection-handling prompt"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setChangelogOpen(false)}>
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <Button onClick={handlePushUpdate} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Push update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
