import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitForm } from "./submit-form";
import type { Category } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Submit a Prompt",
};

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/submit");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Submit a prompt</h1>
        <p className="mt-2 text-muted-foreground">
          Share a prompt that&apos;s made your AI workflow better. Quality over
          quantity — the community will vote.
        </p>
      </div>

      <SubmitForm
        categories={(categories as Category[] | null) ?? []}
        authorId={user.id}
        contributionCount={profile?.contribution_count ?? 0}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  );
}
