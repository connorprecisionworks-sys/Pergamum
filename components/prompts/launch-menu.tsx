"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { track } from "@/lib/analytics";
import { logPromptRun } from "@/lib/prompt-runs";
import { cn } from "@/lib/utils";

type LaunchPlatform = "chatgpt" | "claude" | "gemini";

type Launcher = {
  platform: LaunchPlatform;
  label: string;
  logo: string;
  buildUrl: (encoded: string) => string;
};

const LAUNCHERS: Launcher[] = [
  {
    platform: "chatgpt",
    label: "ChatGPT",
    logo: "/openai.png",
    buildUrl: (q) => `https://chatgpt.com/?q=${q}`,
  },
  {
    platform: "claude",
    label: "Claude",
    logo: "/Claude_AI_symbol.svg.png",
    buildUrl: (q) => `https://claude.ai/new?q=${q}`,
  },
  {
    platform: "gemini",
    label: "Gemini",
    logo: "/Google-gemini-icon.svg.png",
    buildUrl: (q) => `https://gemini.google.com/app?q=${q}`,
  },
];

const DEFAULT_PLATFORM: LaunchPlatform = "chatgpt";
const LAST_USED_KEY = "pk_last_ai";

function isLaunchPlatform(value: string | null): value is LaunchPlatform {
  return LAUNCHERS.some((l) => l.platform === value);
}

interface LaunchMenuProps {
  text: string;
  promptId: string;
  currentUserId: string | null;
  values: Record<string, string>;
  className?: string;
}

export function LaunchMenu({ text, promptId, currentUserId, values, className }: LaunchMenuProps) {
  const [platform, setPlatform] = useState<LaunchPlatform>(DEFAULT_PLATFORM);

  // Read after mount: localStorage doesn't exist during SSR, so seeding state
  // from it directly would make the server and client render different logos.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_USED_KEY);
      if (isLaunchPlatform(stored)) setPlatform(stored);
    } catch {
      // Storage blocked (private mode) — stay on the default.
    }
  }, []);

  const active = LAUNCHERS.find((l) => l.platform === platform) ?? LAUNCHERS[0];

  const handleLaunch = async (launcher: Launcher) => {
    setPlatform(launcher.platform);
    try {
      localStorage.setItem(LAST_USED_KEY, launcher.platform);
    } catch {
      // Storage blocked — the launch still works, it just won't be remembered.
    }

    // Copy first — query-param prefill support varies by tool, so the
    // clipboard is the reliable fallback if the tool ignores the param.
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied — opening ${launcher.label}…`);
    } catch {
      toast.error("Couldn't copy automatically — paste the prompt manually if it doesn't prefill.");
    }

    window.open(launcher.buildUrl(encodeURIComponent(text)), "_blank", "noopener");
    track("prompt_launch", { promptId, platform: launcher.platform });

    if (currentUserId) {
      logPromptRun(promptId, currentUserId, values);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Open in ${active.label} — choose a different AI`}
          className={cn("gap-1.5 px-3", className)}
        >
          <Image
            src={active.logo}
            alt={active.label}
            width={18}
            height={18}
            className="h-[18px] w-[18px] object-contain"
          />
          <ChevronDown className="!size-3.5 text-foreground-subtle" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[9rem]">
        {LAUNCHERS.map((launcher) => (
          <DropdownMenuItem
            key={launcher.platform}
            onSelect={() => handleLaunch(launcher)}
            className="cursor-pointer gap-2.5"
          >
            <Image
              src={launcher.logo}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
            />
            {launcher.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
