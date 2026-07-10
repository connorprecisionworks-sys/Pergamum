"use client";

import { cn } from "@/lib/utils";

export type BuilderStage = "contents" | "cover" | "release";

const STAGES: { key: BuilderStage; label: string }[] = [
  { key: "contents", label: "Contents" },
  { key: "cover", label: "Cover & framing" },
  { key: "release", label: "Release" },
];

export function PackStageNav({ active, onChange }: { active: BuilderStage; onChange: (s: BuilderStage) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-border pb-px">
      {STAGES.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onChange(s.key)}
          className={cn(
            "px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors",
            active === s.key
              ? "border-primary text-foreground"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
