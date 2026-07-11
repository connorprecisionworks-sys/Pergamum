"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Industry, RoleCategory } from "@/lib/types/database";

interface ClientOnboardingInput {
  roleCategory: RoleCategory | null;
  industry: Industry | null;
  goals: string[];
  needText: string | null;
}

/**
 * Client first-run capture (Prmpt Client Onboarding mockup): role, industry,
 * the need chips, and the optional free-text need.
 *
 * A client is someone who used a prompt and kept it — not a publisher. They are
 * never asked for a public @handle or a bio; handle_new_user() already
 * auto-generates a unique username at signup, which satisfies the schema.
 * Real @handle + bio capture belongs to the creator path
 * (completeOnboarding, below), at first publish.
 *
 * The upsert names only the columns this flow owns, so ON CONFLICT DO UPDATE
 * leaves job_title / company_name / linkedin_url — set from the profile
 * settings — untouched.
 *
 * Returns rather than redirects: the payoff screen renders after this saves.
 */
export async function completeClientOnboarding(
  input: ClientOnboardingInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: existing } = await supabase
    .from("user_attributes")
    .select("completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("user_attributes").upsert(
    {
      user_id: user.id,
      role_category: input.roleCategory,
      industry: input.industry,
      goals: input.goals.length > 0 ? input.goals : null,
      need_text: input.needText?.trim() || null,
      completed_at: existing?.completed_at ?? new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: "Couldn't save that. Try again." };
  }

  await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  // analytics_events table is not in generated types until migration runs
  // eslint-disable-next-line
  await (supabase as any).from("analytics_events").insert({
    event: "onboarding_completed",
    user_id: user.id,
  });

  return { success: true };
}

/** Every step is skippable — the value is already in hand. */
export async function skipClientOnboarding() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  redirect("/library");
}

export async function completeOnboarding(
  _prevState: { error?: string },
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const displayName = (formData.get("display_name") as string | null)?.trim();
  const username = (formData.get("username") as string | null)?.trim();
  const bio = (formData.get("bio") as string | null)?.trim() || null;

  if (!displayName || displayName.length < 2) {
    return { error: "Display name must be at least 2 characters." };
  }
  if (!username || username.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { error: "Username must be at least 3 characters (letters, numbers, _ -)." };
  }

  // Check username availability (allow keeping current username)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "That username is already taken." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      username,
      bio,
      onboarding_complete: true,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to save your profile. Please try again." };
  }

  // analytics_events table is not in generated types until migration runs
  // eslint-disable-next-line
  await (supabase as any).from("analytics_events").insert({
    event: "onboarding_completed",
    user_id: user.id,
  });

  redirect("/submit");
}

export async function skipOnboarding() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  redirect("/submit");
}
