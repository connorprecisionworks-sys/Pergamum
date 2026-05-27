import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SkillSubmitForm } from "./skill-submit-form";

export const metadata: Metadata = {
  title: "Share a Claude Code Skill",
};

export default async function SubmitSkillPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/skills/submit");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Share a skill</h1>
        <p className="mt-2 text-muted-foreground">
          Got a Claude Code skill that&apos;s saved you time? Drop the install
          command, link to the source, and tell people what it does. We&apos;ll
          review it (usually within an hour) before it goes live.
        </p>
      </div>

      <SkillSubmitForm
        authorId={user.id}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  );
}
