import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitForm } from "../../submit-form";
import type { Category } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Edit prompt",
};

interface EditPromptPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPromptPage({ params }: EditPromptPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/submit/edit/${id}`);
  }

  const [{ data: prompt }, { data: categories }] = await Promise.all([
    supabase
      .from("prompts")
      .select("id, slug, status, version, title, description, body, model_tags, category_id, tags, variables, author_id")
      .eq("id", id)
      .single(),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  if (!prompt) notFound();
  if (prompt.author_id !== user.id) redirect("/dashboard");

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight">Edit prompt</h1>
        <p className="mt-2 text-muted-foreground">
          {prompt.status === "published"
            ? "Changes go live immediately — add a one-line changelog so people who saved this know what changed."
            : "Update your draft before it goes live."}
        </p>
      </div>

      <SubmitForm
        categories={(categories as Category[] | null) ?? []}
        isAdmin={false}
        isFirstPrompt={false}
        editing={prompt}
      />
    </div>
  );
}
