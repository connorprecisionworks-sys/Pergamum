import type { Metadata } from "next";
import Link from "next/link";
import { Award, Star, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeShowcase } from "@/components/profile/badge-showcase";
import type { Badge as BadgeType } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Badges",
  description: "All badges available on Pergamum and who has earned them.",
};

const TIER_CONFIG = {
  gold:   { label: "Gold",   icon: Crown,  color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  silver: { label: "Silver", icon: Star,   color: "text-zinc-400",   bg: "bg-zinc-50 dark:bg-zinc-800/40" },
  bronze: { label: "Bronze", icon: Award,  color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/30" },
} as const;

export default async function BadgesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [badgesResult, userBadgesResult, earnedCountsResult] = await Promise.all([
    supabase.from("badges").select("*").order("tier"),
    user ? supabase.from("user_badges").select("*").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    supabase.from("user_badges").select("badge_id"),
  ]);

  const allBadges = (badgesResult.data ?? []) as BadgeType[];
  const myBadges = userBadgesResult.data ?? [];
  const earnedCounts = (earnedCountsResult.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.badge_id] = (acc[r.badge_id] ?? 0) + 1;
    return acc;
  }, {});

  const byTier = {
    gold:   allBadges.filter((b) => b.tier === "gold"),
    silver: allBadges.filter((b) => b.tier === "silver"),
    bronze: allBadges.filter((b) => b.tier === "bronze"),
  };

  const myEarnedIds = new Set(myBadges.map((b) => b.badge_id));

  return (
    <div className="container py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-serif">Badges</h1>
        <p className="text-muted-foreground mt-1">
          Earn badges by contributing to the library, gaining followers, and building reputation.
        </p>
        {user && (
          <p className="text-sm text-pergamum-600 mt-1">
            You've earned {myBadges.length} of {allBadges.length} badges.
          </p>
        )}
      </div>

      {(["gold", "silver", "bronze"] as const).map((tier) => {
        const { label, icon: Icon, color, bg } = TIER_CONFIG[tier];
        const badges = byTier[tier];
        if (badges.length === 0) return null;
        return (
          <div key={tier} className="mb-10">
            <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg ${bg} w-fit`}>
              <Icon className={`h-4 w-4 ${color}`} />
              <span className={`text-sm font-semibold ${color}`}>{label}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map((badge) => {
                const earned = myEarnedIds.has(badge.id);
                const count = earnedCounts[badge.id] ?? 0;
                return (
                  <Card key={badge.id} className={`transition-all ${earned ? "border-pergamum-300 dark:border-pergamum-700" : "opacity-70"}`}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={`w-10 h-10 rounded-lg ring-2 flex items-center justify-center shrink-0 ${earned ? `ring-${tier === "gold" ? "yellow" : tier === "silver" ? "zinc" : "amber"}-400/50 ${bg}` : "ring-border bg-muted/40"}`}>
                        <Icon className={`h-5 w-5 ${earned ? color : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{badge.name}</span>
                          {earned && <Badge variant="pergamum" className="text-[10px] py-0 h-4">Earned</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {count} {count === 1 ? "person has" : "people have"} earned this
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
