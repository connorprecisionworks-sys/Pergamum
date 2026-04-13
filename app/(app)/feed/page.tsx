import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PromptCard } from "@/components/prompts/prompt-card";
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-serif">Following</h1>
        <p className="text-muted-foreground mt-1">
          Prompts from people you follow, newest first.
        </p>
      </div>

      {followingIds.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 gap-4">
          <div className="rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="font-semibold">You're not following anyone yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Visit a user's profile and hit Follow to see their prompts here.
            </p>
          </div>
          <Link
            href="/prompts"
            className="text-sm text-pergamum-600 hover:text-pergamum-700 font-medium"
          >
            Browse the library →
          </Link>
        </div>
      ) : prompts.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 gap-3">
          <p className="text-sm text-muted-foreground">
            The people you follow haven't published anything yet.
          </p>
          <Link
            href="/prompts"
            className="text-sm text-pergamum-600 hover:text-pergamum-700 font-medium"
          >
            Browse the library →
          </Link>
        </div>
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
