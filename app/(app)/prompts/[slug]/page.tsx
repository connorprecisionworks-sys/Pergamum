import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PromptDetail } from "@/components/prompts/prompt-detail";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/utils";
import type { PromptWithAuthor, CommentWithAuthor, VoteValue } from "@/lib/types/database";
import { CommentSection } from "./comment-section";

interface PromptPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PromptPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: prompt } = await supabase
    .from("prompts")
    .select("title, description")
    .eq("slug", slug)
    .single();

  if (!prompt) return { title: "Prompt not found" };

  return {
    title: prompt.title,
    description: prompt.description ?? undefined,
  };
}

export default async function PromptPage({ params }: PromptPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch prompt
  const { data: prompt } = await supabase
    .from("prompts")
    .select(
      `*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
    )
    .eq("slug", slug)
    .single();

  if (!prompt || (prompt.status !== "published" && prompt.author_id !== user?.id)) {
    notFound();
  }

  // Fetch current user's vote
  let currentVote: VoteValue | null = null;
  if (user) {
    const { data: vote } = await supabase
      .from("votes")
      .select("value")
      .eq("user_id", user.id)
      .eq("prompt_id", prompt.id)
      .single();
    if (vote) currentVote = vote.value as VoteValue;
  }

  // Fetch comments with authors (top-level only, replies fetched via nesting)
  const { data: comments } = await supabase
    .from("comments")
    .select(`*, profiles:profiles!comments_user_id_fkey(id, username, display_name, avatar_url)`)
    .eq("prompt_id", prompt.id)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  return (
    <div className="container py-8">
      <Link
        href="/prompts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to prompts
      </Link>

      <PromptDetail
        prompt={prompt as PromptWithAuthor}
        currentUserId={user?.id ?? null}
        currentVote={currentVote}
      />

      <Separator className="my-12" />

      {/* Comments */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            Comments{" "}
            {comments && comments.length > 0 && (
              <span className="text-muted-foreground font-normal text-base">
                ({comments.length})
              </span>
            )}
          </h2>
        </div>

        <CommentSection
          promptId={prompt.id}
          initialComments={(comments as CommentWithAuthor[] | null) ?? []}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
