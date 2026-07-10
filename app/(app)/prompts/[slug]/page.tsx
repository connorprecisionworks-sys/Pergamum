import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PromptDetail } from "@/components/prompts/prompt-detail";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/utils";
import { AddToCollectionButton } from "@/components/collections/add-to-collection-button";
import type { PromptWithAuthor, CommentWithAuthor, VoteValue } from "@/lib/types/database";

const CommentSection = dynamic(
  () => import("./comment-section").then((m) => ({ default: m.CommentSection })),
  { ssr: true }
);

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

  // Fetch current user's vote + collections containing this prompt
  let currentVote: VoteValue | null = null;
  let containingCollectionIds: string[] = [];
  if (user) {
    const [voteResult, containingResult] = await Promise.all([
      supabase.from("votes").select("value").eq("user_id", user.id).eq("prompt_id", prompt.id).single(),
      supabase
        .from("collection_prompts")
        .select("collection_id, collections!inner(owner_id)")
        .eq("prompt_id", prompt.id)
        .eq("collections.owner_id" as never, user.id),
    ]);
    if (voteResult.data) currentVote = voteResult.data.value as VoteValue;
    containingCollectionIds = (containingResult.data ?? []).map(
      (r: { collection_id: string }) => r.collection_id
    );
  }

  // Fetch comments with authors (top-level only, replies fetched via nesting)
  const { data: comments } = await supabase
    .from("comments")
    .select(`*, profiles:profiles!comments_user_id_fkey(id, username, display_name, avatar_url)`)
    .eq("prompt_id", prompt.id)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://prmptkit.com";
  const promptAuthor = (prompt as PromptWithAuthor).profiles;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: prompt.title,
    description: prompt.description ?? undefined,
    url: `${BASE_URL}/prompts/${prompt.slug}`,
    datePublished: prompt.published_at ?? prompt.created_at,
    dateModified: prompt.updated_at ?? prompt.published_at ?? prompt.created_at,
    author: {
      "@type": "Person",
      name: promptAuthor?.display_name ?? promptAuthor?.username ?? "Unknown",
      url: promptAuthor?.username
        ? `${BASE_URL}/u/${promptAuthor.username}`
        : undefined,
    },
  };

  return (
    <div className="container py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape closing script tags so user-supplied title/description
          // can't break out of the JSON-LD block.
          __html: JSON.stringify(jsonLd).replace(/<\/script>/gi, "<\\/script>"),
        }}
      />
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

      {user && (
        <div className="max-w-3xl mx-auto flex justify-end mt-4">
          <AddToCollectionButton
            promptId={prompt.id}
            currentUserId={user.id}
            initialContaining={containingCollectionIds}
          />
        </div>
      )}

      <Separator className="my-12" />

      {/* Comments */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-xl font-medium">
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
