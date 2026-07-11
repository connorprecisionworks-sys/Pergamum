import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PromptDetail } from "@/components/prompts/prompt-detail";
import { relativeTime } from "@/lib/utils";
import { AddToCollectionButton } from "@/components/collections/add-to-collection-button";
import type { PromptWithAuthor, CommentWithAuthor, VoteValue } from "@/lib/types/database";

const CommentSection = dynamic(
  () => import("./comment-section").then((m) => ({ default: m.CommentSection })),
  { ssr: true }
);

interface PromptPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ run?: string; preset?: string }>;
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

export default async function PromptPage({ params, searchParams }: PromptPageProps) {
  const { slug } = await params;
  const { run: runId, preset: presetId } = await searchParams;
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
  let initiallySaved = false;
  let initialValues: Record<string, string> | undefined;
  if (user) {
    const [voteResult, containingResult, saveResult, runResult, presetResult] = await Promise.all([
      supabase.from("votes").select("value").eq("user_id", user.id).eq("prompt_id", prompt.id).single(),
      supabase
        .from("collection_prompts")
        .select("collection_id, collections!inner(owner_id)")
        .eq("prompt_id", prompt.id)
        .eq("collections.owner_id" as never, user.id),
      supabase.from("prompt_saves").select("id").eq("user_id", user.id).eq("prompt_id", prompt.id).maybeSingle(),
      runId
        ? supabase.from("prompt_runs").select("values").eq("id", runId).eq("user_id", user.id).eq("prompt_id", prompt.id).maybeSingle()
        : Promise.resolve({ data: null }),
      presetId
        ? supabase.from("prompt_presets").select("values").eq("id", presetId).eq("user_id", user.id).eq("prompt_id", prompt.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (voteResult.data) currentVote = voteResult.data.value as VoteValue;
    containingCollectionIds = (containingResult.data ?? []).map(
      (r: { collection_id: string }) => r.collection_id
    );
    initiallySaved = !!saveResult.data;
    const restoredValues = runResult.data?.values ?? presetResult.data?.values;
    if (restoredValues) initialValues = restoredValues as unknown as Record<string, string>;
  }

  // Fetch comments with authors (top-level only, replies fetched via nesting)
  const { data: comments } = await supabase
    .from("comments")
    .select(`*, profiles:profiles!comments_user_id_fkey(id, username, display_name, avatar_url)`)
    .eq("prompt_id", prompt.id)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  // Living Prompts: version history (empty unless the prompt has been
  // edited-and-republished at least once — v1 has no row, see 0017).
  const { data: versions } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("prompt_id", prompt.id)
    .order("version", { ascending: false });

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://useprmpt.com";
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
    // The document floats on the mockup's soft desk rather than sitting on the
    // app's white content surface.
    <div className="min-h-full bg-background-inset px-6 pb-24 pt-8 md:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape closing script tags so user-supplied title/description
          // can't break out of the JSON-LD block.
          __html: JSON.stringify(jsonLd).replace(/<\/script>/gi, "<\\/script>"),
        }}
      />

      <div className="mx-auto mb-8 flex max-w-[760px] items-center">
        <Link
          href="/prompts"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to prompts
        </Link>
        {promptAuthor?.username && (
          <span className="ml-auto text-[11px] uppercase tracking-[0.08em] text-foreground-subtle">
            Shared by @{promptAuthor.username}
          </span>
        )}
      </div>

      <PromptDetail
        prompt={prompt as PromptWithAuthor}
        currentUserId={user?.id ?? null}
        currentVote={currentVote}
        versions={versions ?? []}
        initiallySaved={initiallySaved}
        initialValues={initialValues}
      />

      {user && (
        <div className="mx-auto mt-4 flex max-w-[760px] justify-end">
          <AddToCollectionButton
            promptId={prompt.id}
            currentUserId={user.id}
            initialContaining={containingCollectionIds}
          />
        </div>
      )}

      {/* Comments */}
      <div className="mx-auto mt-16 max-w-[760px] rounded-[20px] bg-card p-8 shadow-[0_12px_34px_rgba(28,30,40,0.12)] md:p-10">
        <div className="mb-6 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-foreground-muted" />
          <h2 className="text-lg font-medium">
            Comments{" "}
            {comments && comments.length > 0 && (
              <span className="text-base font-normal text-foreground-subtle">
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
