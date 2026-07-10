import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, ArrowUp, Star, Copy } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCount } from "@/lib/utils";
import type { Profile, PromptWithAuthor } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Top prompts and top contributors on Prmpt.",
};

// Rank colors for top 3 — no emojis
const RANK_COLOR = ["text-yellow-400", "text-zinc-300", "text-amber-600"];

export default async function LeaderboardsPage() {
  const supabase = await createClient();

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [allTimeResult, weekResult, contributorsResult] = await Promise.all([
    supabase
      .from("prompts")
      .select(
        `id, title, slug, upvotes, views, copies, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
      )
      .eq("status", "published")
      .order("upvotes", { ascending: false })
      .limit(10),
    supabase
      .from("prompts")
      .select(
        `id, title, slug, upvotes, views, copies, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
      )
      .eq("status", "published")
      .gte("published_at", oneWeekAgo)
      .order("upvotes", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, reputation, contribution_count, lifetime_copies, lifetime_upvotes_received")
      .order("reputation", { ascending: false })
      .limit(20),
  ]);

  const allTimePrompts = (allTimeResult.data ?? []) as PromptWithAuthor[];
  const weekPrompts = (weekResult.data ?? []) as PromptWithAuthor[];
  const contributors = (contributorsResult.data ?? []) as Pick<
    Profile,
    "id" | "username" | "display_name" | "avatar_url" | "reputation" | "contribution_count" | "lifetime_copies" | "lifetime_upvotes_received"
  >[];

  return (
    <div className="container py-10 max-w-4xl">
      <div className="rounded-lg px-6 py-7 mb-10 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)]">
        <span className="label-mono">Rankings</span>
        <h1 className="font-serif text-[32px] md:text-[48px] font-normal tracking-h1 mt-3 leading-tight">Leaderboards</h1>
        <p className="text-foreground-muted mt-2">
          Top prompts and contributors on Prmpt.
        </p>
      </div>

      <Tabs defaultValue="all-time">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="all-time" className="flex-1">All-time</TabsTrigger>
          <TabsTrigger value="this-week" className="flex-1">This week</TabsTrigger>
          <TabsTrigger value="contributors" className="flex-1">Contributors</TabsTrigger>
        </TabsList>

        <TabsContent value="all-time">
          <PromptLeaderboard prompts={allTimePrompts} />
        </TabsContent>
        <TabsContent value="this-week">
          <PromptLeaderboard prompts={weekPrompts} />
        </TabsContent>
        <TabsContent value="contributors">
          <ContributorLeaderboard contributors={contributors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PromptLeaderboard({ prompts }: { prompts: PromptWithAuthor[] }) {
  if (prompts.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="h-6 w-6 text-muted-foreground" />}
        title="Be the first on the leaderboard"
        description="Submit a prompt and earn upvotes to claim the top spot."
        action={{ label: "Submit a prompt", href: "/submit" }}
      />
    );
  }
  return (
    <div className="space-y-2">
      {prompts.map((prompt, i) => {
        const author = prompt.profiles;
        const initials = author?.display_name
          ? author.display_name.slice(0, 2).toUpperCase()
          : author?.username?.slice(0, 2).toUpperCase() ?? "??";

        return (
          <Card key={prompt.id} className={i < 3 ? "border-yellow-200 dark:border-yellow-900/50" : ""}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-8 text-center shrink-0">
                <span className={`font-mono text-sm font-bold ${RANK_COLOR[i] ?? "text-foreground-subtle"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/prompts/${prompt.slug}`}
                  className="font-semibold text-sm hover:text-brand-600 dark:hover:text-brand-300 transition-colors line-clamp-1"
                >
                  {prompt.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={author?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[8px] bg-brand-100 text-brand-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/u/${author?.username}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {author?.display_name ?? author?.username}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                <div className="flex items-center gap-1">
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{formatCount(prompt.upvotes)}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  <Copy className="h-3.5 w-3.5" />
                  <span>{formatCount(prompt.copies)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ContributorLeaderboard({
  contributors,
}: {
  contributors: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "reputation" | "contribution_count" | "lifetime_copies" | "lifetime_upvotes_received">[];
}) {
  if (contributors.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="h-6 w-6 text-muted-foreground" />}
        title="No contributors yet"
        description="Submit prompts and earn reputation to appear here."
        action={{ label: "Submit a prompt", href: "/submit" }}
      />
    );
  }
  return (
    <div className="space-y-2">
      {contributors.map((user, i) => {
        const initials = user.display_name
          ? user.display_name.slice(0, 2).toUpperCase()
          : user.username.slice(0, 2).toUpperCase();

        return (
          <Card key={user.id} className={i < 3 ? "border-yellow-200 dark:border-yellow-900/50" : ""}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-8 text-center shrink-0">
                <span className={`font-mono text-sm font-bold ${RANK_COLOR[i] ?? "text-foreground-subtle"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-brand-100 text-brand-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/u/${user.username}`}
                  className="font-semibold text-sm hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                >
                  {user.display_name ?? user.username}
                </Link>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                <div className="flex items-center gap-1" title="Reputation">
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="font-medium text-foreground">{formatCount(user.reputation)}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1" title="Published prompts">
                  <span className="text-xs">{user.contribution_count} prompts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
