"use client";

import { Award, Star, Crown, FileText, Library, BookOpen, ArrowUp, ThumbsUp, Trophy, Copy, Files, Bookmark, Users, GitFork } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Badge, UserBadge } from "@/lib/types/database";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Award, Star, Crown, FileText, Library, BookOpen, ArrowUp, ThumbsUp,
  Trophy, Copy, Files, Bookmark, Users, GitFork,
};

const TIER_RING: Record<string, string> = {
  bronze: "ring-amber-600/50 bg-amber-50 dark:bg-amber-950/30",
  silver: "ring-zinc-400/60 bg-zinc-50 dark:bg-zinc-800/40",
  gold:   "ring-yellow-500/60 bg-yellow-50 dark:bg-yellow-950/30",
};

const TIER_ICON: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-zinc-400",
  gold:   "text-yellow-500",
};

interface BadgeShowcaseProps {
  allBadges: Badge[];
  earnedBadges: UserBadge[];
}

export function BadgeShowcase({ allBadges, earnedBadges }: BadgeShowcaseProps) {
  const earnedIds = new Set(earnedBadges.map((b) => b.badge_id));

  // Show gold → silver → bronze order
  const sorted = [...allBadges].sort((a, b) => {
    const order = { gold: 0, silver: 1, bronze: 2 };
    return order[a.tier] - order[b.tier];
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-2">
        {sorted.map((badge) => {
          const earned = earnedIds.has(badge.id);
          const IconComp = ICON_MAP[badge.icon] ?? Award;
          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div
                  className={`
                    w-10 h-10 rounded-lg ring-2 flex items-center justify-center cursor-default
                    transition-all duration-200
                    ${earned
                      ? TIER_RING[badge.tier]
                      : "ring-border bg-muted/40 opacity-35"
                    }
                  `}
                  aria-label={`${badge.name}${earned ? " (earned)" : " (locked)"}`}
                >
                  <IconComp
                    className={`h-4 w-4 ${earned ? TIER_ICON[badge.tier] : "text-muted-foreground"}`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-center">
                <p className="font-semibold text-xs mb-0.5">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
                {!earned && (
                  <p className="text-xs text-pergamum-500 mt-1 font-medium">Locked</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
