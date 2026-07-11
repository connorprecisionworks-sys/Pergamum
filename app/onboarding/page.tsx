import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientOnboardingForm } from "@/components/onboarding/client-onboarding-form";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  // Skip if already onboarded
  if (profile.onboarding_complete) redirect("/dashboard");

  // "We've kept the one you just used" — the prompt that brought them here.
  // A claim writes a run (see lib/claim.ts), so the newest run is it; a plain
  // save is the fallback.
  const [{ data: lastRun }, { data: lastSave }] = await Promise.all([
    supabase
      .from("prompt_runs")
      .select("created_at, prompts(title, slug, profiles:profiles!prompts_author_id_fkey(username))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("prompt_saves")
      .select("created_at, prompts(title, slug, profiles:profiles!prompts_author_id_fkey(username))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  type KeptRow = {
    created_at: string;
    prompts: { title: string; slug: string; profiles: { username: string } | null } | null;
  } | null;

  const runRow = lastRun as unknown as KeptRow;
  const saveRow = lastSave as unknown as KeptRow;
  const kept = runRow?.prompts ? runRow : saveRow;

  const justUsed = kept?.prompts
    ? {
        title: kept.prompts.title,
        slug: kept.prompts.slug,
        authorUsername: kept.prompts.profiles?.username ?? null,
      }
    : null;

  // Payoff candidates. There is no demand-matching model yet, so the form ranks
  // these against the user's own answers and falls back to popularity.
  const [{ data: prompts }, { data: creators }, { data: following }] = await Promise.all([
    supabase
      .from("prompts")
      .select("id, title, slug, description, tags, variables, profiles:profiles!prompts_author_id_fkey(username)")
      .eq("status", "published")
      .order("copies", { ascending: false })
      .limit(12),
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio")
      .neq("id", user.id)
      .order("reputation", { ascending: false })
      .limit(6),
    supabase.from("follows").select("following_id").eq("follower_id", user.id),
  ]);

  const followingIds = new Set((following ?? []).map((f) => f.following_id));

  const candidatePrompts = (
    (prompts ?? []) as unknown as {
      id: string;
      title: string;
      slug: string;
      description: string | null;
      tags: string[] | null;
      variables: unknown;
      profiles: { username: string } | null;
    }[]
  ).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    tags: p.tags ?? [],
    authorUsername: p.profiles?.username ?? null,
    fieldCount: Array.isArray(p.variables) ? p.variables.length : 0,
  }));

  const candidateCreators = (creators ?? []).map((c) => ({
    id: c.id,
    username: c.username,
    displayName: c.display_name,
    avatarUrl: c.avatar_url,
    bio: c.bio,
    following: followingIds.has(c.id),
  }));

  return (
    <ClientOnboardingForm
      currentUserId={user.id}
      justUsed={justUsed}
      candidatePrompts={candidatePrompts}
      candidateCreators={candidateCreators}
    />
  );
}
