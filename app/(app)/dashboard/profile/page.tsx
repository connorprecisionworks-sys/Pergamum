import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/profile");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/auth/login");

  const { data: prompts } = await supabase
    .from("prompts")
    .select("id, title")
    .eq("author_id", user.id)
    .eq("status", "published")
    .order("title");

  return (
    <div className="container py-10 max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-serif">Edit profile</h1>
        <p className="text-muted-foreground mt-1">
          Your profile is public at{" "}
          <Link href={`/u/${profile.username}`} className="text-pergamum-600 hover:text-pergamum-700">
            /u/{profile.username}
          </Link>
        </p>
      </div>
      <ProfileForm profile={profile} publishedPrompts={prompts ?? []} />
    </div>
  );
}
