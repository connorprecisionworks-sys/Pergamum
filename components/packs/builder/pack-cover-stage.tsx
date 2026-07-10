"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { PackCover } from "@/components/packs/pack-cover";
import { updatePackFields } from "@/app/(app)/dashboard/packs/actions";
import { cn } from "@/lib/utils";

const ACCENT_SWATCHES = [
  { label: "Ink", value: "#3C5F86" },
  { label: "Ink Deep", value: "#2A4463" },
  { label: "Ink Light", value: "#7396BD" },
];

interface PackCoverStageProps {
  packId: string;
  title: string;
  linerNote: string;
  coverSeed: string;
  accent: string;
  itemTitles: string[];
  creatorDisplayName: string;
  onChange: (patch: { liner_note?: string; cover_seed?: string; accent?: string }) => void;
}

export function PackCoverStage({
  packId,
  title,
  linerNote,
  coverSeed,
  accent,
  itemTitles,
  creatorDisplayName,
  onChange,
}: PackCoverStageProps) {
  const [drafting, setDrafting] = useState(false);
  const seedBase = coverSeed || packId;
  const variantSeeds = [`${seedBase}-0`, `${seedBase}-1`, `${seedBase}-2`];

  const selectSeed = async (seed: string) => {
    onChange({ cover_seed: seed });
    await updatePackFields(packId, { cover_seed: seed });
  };

  const selectAccent = async (value: string) => {
    onChange({ accent: value });
    await updatePackFields(packId, { accent: value });
  };

  const saveLinerNote = async (value: string) => {
    await updatePackFields(packId, { liner_note: value });
  };

  const draftLinerNote = async () => {
    setDrafting(true);
    try {
      const res = await fetch("/api/packs/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "liner_note", packTitle: title, itemTitles, creatorName: creatorDisplayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange({ liner_note: data.text });
      await updatePackFields(packId, { liner_note: data.text });
    } catch {
      toast.error("Couldn't draft a liner note right now.");
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-2">Cover</h3>
        <div className="grid grid-cols-3 gap-3">
          {variantSeeds.map((seed) => (
            <button
              key={seed}
              type="button"
              onClick={() => selectSeed(seed)}
              className={cn(
                "relative rounded-md overflow-hidden ring-2 ring-offset-2 ring-offset-background transition-all",
                coverSeed === seed ? "ring-primary" : "ring-transparent hover:ring-border-strong"
              )}
            >
              <PackCover title={title} seed={seed} accent={accent} />
              {coverSeed === seed && (
                <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          ))}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" size="sm" disabled className="mt-3 gap-1.5 text-xs">
                  <Upload className="h-3.5 w-3.5" />
                  Upload cover
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Coming soon — needs image storage wired up.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-2">Accent</h3>
        <div className="flex items-center gap-2">
          {ACCENT_SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              onClick={() => selectAccent(swatch.value)}
              aria-label={swatch.label}
              className={cn(
                "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                accent === swatch.value ? "ring-2 ring-primary" : "ring-1 ring-border-strong"
              )}
              style={{ backgroundColor: swatch.value }}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">Liner note</h3>
          <Button variant="ghost" size="sm" onClick={draftLinerNote} disabled={drafting} className="h-7 gap-1.5 text-xs text-foreground-subtle">
            {drafting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Draft with AI
          </Button>
        </div>
        <Textarea
          value={linerNote}
          onChange={(e) => onChange({ liner_note: e.target.value })}
          onBlur={(e) => saveLinerNote(e.target.value)}
          rows={4}
          placeholder="Why you built this pack, in your own voice."
          className="text-sm"
        />
      </div>
    </div>
  );
}
