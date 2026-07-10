"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProProfileForm } from "./pro-profile-form";
import { getSessionCount } from "@/lib/session-count";
import type { UserAttributes } from "@/lib/types/database";

const DISMISS_KEY = "pk_personalize_dismissed";

interface PersonalizeCardProps {
  hasCompletedProfile: boolean;
  promptRunsCount: number;
  initial: UserAttributes | null;
}

/**
 * Progressive, dismissible personalization prompt — never a signup gate.
 * Shows on the dashboard once the user has cleared either trigger (second
 * session or second save), unless they've already completed it or
 * dismissed it before. Doubles as the backfill banner for existing users:
 * they'll almost always already clear "second session" the first time
 * they land here post-launch, so no separate path is needed.
 */
export function PersonalizeCard({ hasCompletedProfile, promptRunsCount, initial }: PersonalizeCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasCompletedProfile) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // Storage unavailable — fall through and show it anyway.
    }
    const sessionCount = getSessionCount();
    if (sessionCount >= 2 || promptRunsCount >= 2) setVisible(true);
  }, [hasCompletedProfile, promptRunsCount]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Non-critical — worst case it can reappear next session.
    }
  };

  if (!visible) return null;

  return (
    <Card className="mb-8 border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/20">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-base">Personalize your prompts</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tell us what you do and your prompts show up tuned to you.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={dismiss}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ProProfileForm initial={initial} variant="card" onSaved={() => setVisible(false)} />
      </CardContent>
    </Card>
  );
}
