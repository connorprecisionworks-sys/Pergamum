import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GitFork } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SubmitForm } from "./submit-form";
import type { Category, Prompt } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Submit a Prompt",
};

interface SubmitPageProps {
  searchParams: Promise<{ fork_from?: string }>;
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

  const [profileResult, categoriesResult, sourceResult] = await Promise.all([
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
  ]);

  const profile = profileResult.data;
  const categories = (categoriesResult.data as Category[] | null) ?? [];
  const sourcePrompt = sourceResult.data as Pick<
    Prompt,
    "id" | "title" | "description" | "body" | "model_tags" | "category_id" | "tags" | "variables"
  > | null;

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        {sourcePrompt ? (
          <>
            <div className="flex items-center gap-2 text-sm text-pergamum-600 mb-2">
              <GitFork className="h-4 w-4" />
              <span>Remixing a prompt</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Remix prompt</h1>
            <p className="mt-2 text-muted-foreground">
              You're building on someone else's work — make it yours and give it a new title.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Submit a prompt</h1>
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
        contributionCount={profile?.contribution_count ?? 0}
        isAdmin={profile?.is_admin ?? false}
        forkedFrom={sourcePrompt ?? undefined}
      />
    </div>
  );
}
