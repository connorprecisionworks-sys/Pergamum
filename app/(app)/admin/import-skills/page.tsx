import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ImportSkillsForm } from "./import-skills-form";

export const metadata: Metadata = {
  title: "Admin — Import Skills from GitHub",
};

export default async function AdminImportSkillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <div className="container py-10">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to moderation queue
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Import skills from GitHub
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste a GitHub repo URL to add it as a skill. One repo, one skill.
          Admin only. Imported skills publish immediately under your account.
        </p>
      </div>

      <ImportSkillsForm adminId={user.id} />
    </div>
  );
}
