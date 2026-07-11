"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { logPromptRun } from "@/lib/prompt-runs";

type LaunchPlatform = "chatgpt" | "claude" | "gemini";

const LAUNCHERS: {
  platform: LaunchPlatform;
  label: string;
  buildUrl: (encoded: string) => string;
}[] = [
  { platform: "chatgpt", label: "ChatGPT", buildUrl: (q) => `https://chatgpt.com/?q=${q}` },
  { platform: "claude",  label: "Claude",  buildUrl: (q) => `https://claude.ai/new?q=${q}` },
  { platform: "gemini",  label: "Gemini",  buildUrl: (q) => `https://gemini.google.com/app?q=${q}` },
];

interface LaunchButtonsProps {
  text: string;
  promptId: string;
  currentUserId: string | null;
  values: Record<string, string>;
  className?: string;
}

export function LaunchButtons({ text, promptId, currentUserId, values, className }: LaunchButtonsProps) {
  const handleLaunch = async (platform: LaunchPlatform, label: string, buildUrl: (q: string) => string) => {
    // Copy first — query-param prefill support varies by tool, so the
    // clipboard is the reliable fallback if the tool ignores the param.
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied — opening ${label}…`);
    } catch {
      toast.error("Couldn't copy automatically — paste the prompt manually if it doesn't prefill.");
    }

    window.open(buildUrl(encodeURIComponent(text)), "_blank", "noopener");
    track("prompt_launch", { promptId, platform });

    if (currentUserId) {
      logPromptRun(promptId, currentUserId, values);
    }
  };

  return (
    <div className={className ? className : "flex items-center gap-1.5 flex-wrap"}>
      {LAUNCHERS.map(({ platform, label, buildUrl }) => (
        <Button
          key={platform}
          variant="ghost"
          size="sm"
          onClick={() => handleLaunch(platform, label, buildUrl)}
          aria-label={`Open in ${label}`}
          className="h-[46px] px-3.5 text-xs font-normal text-foreground-muted hover:text-foreground"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
