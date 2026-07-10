"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RoleCategory, Industry, CompanySize } from "@/lib/types/database";

/**
 * Upserts the current user's professional-profile attributes. Used by both
 * the dismissible personalization card (role/industry/company_size/goals
 * only) and the full "About you" settings section (adds job_title/
 * company_name/linkedin_url). Fields absent from formData are left
 * unset/null rather than assumed — the card never submits the settings-only
 * fields, so it can't clobber values a user already set there.
 *
 * completed_at is set once, the first time any submission succeeds, and
 * never bumped again — it marks "has done progressive profiling at least
 * once," not "last edited at."
 */
export async function saveProProfile(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to save this." };
  }

  const { data: existing } = await supabase
    .from("user_attributes")
    .select("completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const roleCategory = (formData.get("role_category") as string | null) || null;
  const industry = (formData.get("industry") as string | null) || null;
  const companySize = (formData.get("company_size") as string | null) || null;
  const goals = formData.getAll("goals").map(String).filter(Boolean);
  const jobTitle = (formData.get("job_title") as string | null)?.trim() || null;
  const companyName = (formData.get("company_name") as string | null)?.trim() || null;
  const linkedinUrl = (formData.get("linkedin_url") as string | null)?.trim() || null;

  const { error } = await supabase.from("user_attributes").upsert(
    {
      user_id: user.id,
      role_category: roleCategory as RoleCategory | null,
      industry: industry as Industry | null,
      company_size: companySize as CompanySize | null,
      goals: goals.length > 0 ? goals : null,
      job_title: jobTitle,
      company_name: companyName,
      linkedin_url: linkedinUrl,
      completed_at: existing?.completed_at ?? new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: "Couldn't save. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}
