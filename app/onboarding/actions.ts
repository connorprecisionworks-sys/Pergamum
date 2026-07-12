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
 *
 * The upsert names only the columns this flow owns, so ON CONFLICT DO UPDATE
 * leaves job_title / company_name / linkedin_url — set from the profile
 * settings — untouched.
 *
 * Onboarding is mandatory (post-value, not a signup wall — it only runs after
 * the user has already used a prompt and claimed an account), so role_category
 * is required before onboarding_complete can be set. The client already
 * disables its Continue button until a role is picked; this check is the
 * server-side backstop against a direct call bypassing that.
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

  if (!input.roleCategory) {
    return { error: "Pick what you do to continue." };
  }

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
