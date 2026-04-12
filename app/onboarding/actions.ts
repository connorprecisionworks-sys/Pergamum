"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  redirect("/dashboard");
}
