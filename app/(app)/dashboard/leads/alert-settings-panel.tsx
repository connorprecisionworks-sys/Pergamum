"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveAlertSettings } from "@/app/creator/onboarding/actions";
import type { CreatorAlertSettings } from "@/lib/types/database";
import { cn, describeHotThreshold } from "@/lib/utils";

interface AlertSettingsPanelProps {
  initial: CreatorAlertSettings | null;
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        on ? "bg-primary" : "bg-border-strong"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function AlertSettingsPanel({ initial }: AlertSettingsPanelProps) {
  const [hotThreshold, setHotThreshold] = useState(initial?.hot_threshold ?? 50);
  const [inApp, setInApp] = useState(initial?.in_app ?? true);
  const [emailOn, setEmailOn] = useState(initial?.email ?? true);
  const [emailMode, setEmailMode] = useState<"instant" | "daily_digest">(
    (initial?.email_mode as "instant" | "daily_digest") ?? "instant"
  );
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await saveAlertSettings({ hotThreshold, inApp, email: emailOn, emailMode });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Alert settings saved.");
    });
  };

  return (
    <details className="group rounded-lg border">
      <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-3">
        <span className="text-sm font-medium">Alert settings</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <div className="space-y-4 border-t px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">In-app notifications</span>
          <Toggle on={inApp} onToggle={() => setInApp(!inApp)} disabled={pending} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Email</span>
            <Toggle on={emailOn} onToggle={() => setEmailOn(!emailOn)} disabled={pending} />
          </div>
          {emailOn && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setEmailMode("instant")}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  emailMode === "instant" ? "border-primary bg-primary/10" : "border-border-strong text-muted-foreground"
                )}
              >
                Instant
              </button>
              <button
                type="button"
                onClick={() => setEmailMode("daily_digest")}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  emailMode === "daily_digest"
                    ? "border-primary bg-primary/10"
                    : "border-border-strong text-muted-foreground"
                )}
              >
                Daily digest
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 opacity-60">
          <span className="text-sm">Slack</span>
          <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Coming soon</span>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Alert threshold</span>
            <span className="font-mono text-foreground">{hotThreshold}</span>
          </div>
          <input
            type="range"
            min={30}
            max={80}
            value={hotThreshold}
            onChange={(e) => setHotThreshold(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-1.5 flex items-start justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="max-w-[48%]">As soon as someone really uses my prompt</span>
            <span className="max-w-[48%] text-right">Only when someone keeps coming back</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{describeHotThreshold(hotThreshold)}</p>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
      </div>
    </details>
  );
}
