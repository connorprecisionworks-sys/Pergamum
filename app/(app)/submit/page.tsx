import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GitFork, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SubmitForm } from "./submit-form";
import type { Category, Prompt, PromptDraft } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Submit a Prompt",
};

interface SubmitPageProps {
  searchParams: Promise<{ fork_from?: string; from_draft?: string }>;
}

/** Assemble a prompt_drafts row (5 blocks) into a single Markdown-headered body. */
function assembleDraftBody(d: PromptDraft): string {
  const sections: { label: string; value: string }[] = [
    { label: "Role", value: d.role },
    { label: "Context", value: d.context },
    { label: "Task", value: d.task },
    { label: "Constraints", value: d.constraints },
    { label: "Output format", value: d.output_format },
  ];
  return sections
    .filter((s) => s.value.trim().length > 0)
    .map((s) => `# ${s.label}\n${s.value.trim()}`)
    .join("\n\n");
}

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/submit");
  }

  const params = await searchParams;

  const [profileResult, categoriesResult, sourceResult, draftResult, promptCountResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("categories").select("*").order("sort_order"),
    params.fork_from
      ? supabase
          .from("prompts")
          .select("id, title, description, body, model_tags, category_id, tags, variables")
          .eq("id", params.fork_from)
          .eq("status", "published")
          .single()
      : Promise.resolve({ data: null }),
    params.from_draft
      ? supabase
          .from("prompt_drafts")
          .select("*")
          .eq("id", params.from_draft)
          .single()
      : Promise.resolve({ data: null }),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
  ]);

  const profile = profileResult.data;
  const categories = (categoriesResult.data as Category[] | null) ?? [];
  const isFirstPrompt = (promptCountResult.count ?? 0) === 0;
  const sourcePrompt = sourceResult.data as Pick<
    Prompt,
    "id" | "title" | "description" | "body" | "model_tags" | "category_id" | "tags" | "variables"
  > | null;
  const draft = draftResult.data as PromptDraft | null;

  // A draft handoff from /build — assemble the 5 blocks into a body and seed
  // the form. This is NOT a fork (no forked_from_id linkage); we just pre-fill.
  const draftSeed: Pick<
    Prompt,
    "title" | "description" | "body" | "model_tags" | "category_id" | "tags" | "variables"
  > | null = draft
    ? {
        title: draft.title ?? "",
        description: draft.goal ?? "",
        body: assembleDraftBody(draft),
        model_tags: ["any"],
        category_id: null,
        tags: [],
        variables: [],
      }
    : null;

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        {sourcePrompt ? (
          <>
            <div className="flex items-center gap-2 text-sm text-brand-600 mb-2">
              <GitFork className="h-4 w-4" />
              <span>Remixing a prompt</span>
            </div>
            <h1 className="text-3xl font-medium tracking-tight">Remix prompt</h1>
            <p className="mt-2 text-muted-foreground">
              You&apos;re building on someone else&apos;s work — make it yours and give it a new title.
            </p>
          </>
        ) : draftSeed ? (
          <>
            <div className="flex items-center gap-2 text-sm text-brand-600 mb-2">
              <Wand2 className="h-4 w-4" />
              <span>From your builder draft</span>
            </div>
            <h1 className="text-3xl font-medium tracking-tight">Submit your draft</h1>
            <p className="mt-2 text-muted-foreground">
              We pre-filled the form from your{" "}
              <Link href="/build" className="text-primary underline-offset-4 hover:underline">
                builder
              </Link>{" "}
              draft. Fill in the bits the builder doesn&apos;t track — category, models, tags — and ship it.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-medium tracking-tight">Submit a prompt</h1>
            <p className="mt-2 text-muted-foreground">
              Share a prompt that&apos;s made your AI workflow better. Quality over
              quantity — the community will vote.
            </p>
          </>
        )}
      </div>

      <SubmitForm
        categories={categories}
        authorId={user.id}
        isAdmin={profile?.is_admin ?? false}
        isFirstPrompt={isFirstPrompt}
        forkedFrom={sourcePrompt ?? undefined}
        seed={draftSeed ?? undefined}
      />
    </div>
  );
}
