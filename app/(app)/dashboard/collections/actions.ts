"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function createCollection(
  _prev: { error?: string; success?: boolean },
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const is_public = formData.get("is_public") !== "false";
  const cover_color = (formData.get("cover_color") as string) || "zinc";

  if (!title || title.length < 2) return { error: "Title must be at least 2 characters." };

  const base = slugify(title);
  const { data: existing } = await supabase
    .from("collections")
    .select("slug")
    .eq("owner_id", user.id)
    .like("slug", `${base}%`);

  const takenSlugs = (existing ?? []).map((c) => c.slug);
  let slug = base;
  if (takenSlugs.includes(slug)) {
    let i = 2;
    while (takenSlugs.includes(`${base}-${i}`)) i++;
    slug = `${base}-${i}`;
  }

  const { error } = await supabase
    .from("collections")
    .insert({ owner_id: user.id, title, slug, description, is_public, cover_color });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/collections");
  return { success: true };
}

export async function deleteCollection(collectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/collections");
  return { success: true };
}
