"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(_prev: { error?: string; success?: boolean }, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const display_name  = (formData.get("display_name") as string)?.trim() || null;
  const bio           = (formData.get("bio") as string)?.trim() || null;
  const location      = (formData.get("location") as string)?.trim() || null;
  const website       = (formData.get("website") as string)?.trim() || null;
  const twitter       = (formData.get("twitter") as string)?.trim() || null;
  const github        = (formData.get("github") as string)?.trim() || null;
  const featured_prompt_id = (formData.get("featured_prompt_id") as string) || null;

  const { error } = await supabase
    .from("profiles")
    .update({ display_name, bio, location, website, twitter, github, featured_prompt_id })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/profile");
  revalidatePath(`/u`);
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };
  if (file.size > 2 * 1024 * 1024) return { error: "File must be under 2 MB" };
  if (!file.type.startsWith("image/")) return { error: "File must be an image" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard/profile");
  return { success: true, url: publicUrl };
}
