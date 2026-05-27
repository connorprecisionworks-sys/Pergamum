import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, Rss } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PromptCard } from "@/components/prompts/prompt-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { PromptWithAuthor } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Following",
  description: "Prompts from people you follow.",
};

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/feed");

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (follows ?? []).map((f) => f.following_id);

  let prompts: PromptWithAuthor[] = [];
  if (followingIds.length > 0) {
    const { data } = await supabase
      .from("prompts")
      .select(
        `*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
      )
      .in("author_id", followingIds)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(40);
    prompts = (data ?? []) as PromptWithAuthor[];
  }

  return (
    <div className="container py-10 max-w-3xl">
      <div className="rounded-lg px-6 py-7 mb-8 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)]">
        <h1 className="text-3xl font-medium tracking-tight font-serif">Following</h1>
        <p className="text-muted-foreground mt-1">
          Prompts from people you follow, newest first.
        </p>
      </div>

      {followingIds.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6 text-muted-foreground" />}
          title="Follow people to see their prompts here"
          description="Discover contributors worth following on the leaderboards."
          action={{ label: "View leaderboards", href: "/leaderboards" }}
        />
      ) : prompts.length === 0 ? (
        <EmptyState
          icon={<Rss className="h-6 w-6 text-muted-foreground" />}
          title="Nothing from your follows yet"
          description="The people you follow haven't published anything yet."
          action={{ label: "Browse the library", href: "/prompts" }}
        />
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
          {prompts.length === 40 && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              Showing the 40 most recent prompts.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
