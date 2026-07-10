"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify, uniqueSlug } from "@/lib/utils";
import type { Database, PackGating } from "@/lib/types/database";

type PackUpdate = Database["public"]["Tables"]["packs"]["Update"];

async function requireOwnedPack(packId: string, userId: string) {
  const supabase = await createClient();
  const { data: pack } = await supabase.from("packs").select("*").eq("id", packId).single();
  if (!pack || pack.creator_id !== userId) return null;
  return pack;
}

export async function deletePack(packId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("packs").delete().eq("id", packId).eq("creator_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/packs");
  return {};
}

export async function createDraftPack(): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase.from("packs").select("slug").eq("creator_id", user.id).like("slug", "untitled-pack%");
  const slug = uniqueSlug("untitled-pack", (existing ?? []).map((p) => p.slug));

  const { data, error } = await supabase
    .from("packs")
    .insert({ creator_id: user.id, title: "Untitled pack", slug })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updatePackFields(
  packId: string,
  patch: {
    title?: string;
    liner_note?: string | null;
    cover_type?: "auto" | "upload";
    cover_seed?: string | null;
    accent?: string | null;
    gating?: PackGating;
    price_cents?: number;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const pack = await requireOwnedPack(packId, user.id);
  if (!pack) return { error: "Pack not found." };

  const updates: PackUpdate = { ...patch };
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title || title.length < 2) return { error: "Title must be at least 2 characters." };
    updates.title = title;
    // Re-slug only while still an auto-generated "untitled-pack…" slug, so a
    // creator's deliberate custom slug is never silently rewritten later.
    if (pack.slug.startsWith("untitled-pack")) {
      const { data: existing } = await supabase.from("packs").select("slug").eq("creator_id", user.id).neq("id", packId);
      updates.slug = uniqueSlug(slugify(title), (existing ?? []).map((p) => p.slug));
    }
  }

  const { error } = await supabase.from("packs").update(updates).eq("id", packId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/packs/${packId}`);
  return {};
}

export async function addPackItem(
  packId: string,
  itemType: "prompt" | "skill",
  contentId: string
): Promise<{ error?: string; id?: string; position?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const pack = await requireOwnedPack(packId, user.id);
  if (!pack) return { error: "Pack not found." };

  const table = itemType === "prompt" ? "prompts" : "skills";
  const { data: content } = await supabase.from(table).select("author_id").eq("id", contentId).single();
  if (!content || content.author_id !== user.id) {
    return { error: "You can only add your own prompts and skills." };
  }

  const { data: existingItems } = await supabase.from("pack_items").select("position").eq("pack_id", packId).order("position", { ascending: false }).limit(1);
  const nextPosition = (existingItems?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("pack_items")
    .insert({
      pack_id: packId,
      item_type: itemType,
      prompt_id: itemType === "prompt" ? contentId : null,
      skill_id: itemType === "skill" ? contentId : null,
      position: nextPosition,
    })
    .select("id, position")
    .single();
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/packs/${packId}`);
  return { id: data.id, position: data.position };
}

export async function removePackItem(packId: string, itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const pack = await requireOwnedPack(packId, user.id);
  if (!pack) return { error: "Pack not found." };

  const { error } = await supabase.from("pack_items").delete().eq("id", itemId).eq("pack_id", packId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/packs/${packId}`);
  return {};
}

export async function updatePackItem(
  packId: string,
  itemId: string,
  patch: { promise_line?: string; is_preview?: boolean }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const pack = await requireOwnedPack(packId, user.id);
  if (!pack) return { error: "Pack not found." };

  const { error } = await supabase.from("pack_items").update(patch).eq("id", itemId).eq("pack_id", packId);
  if (error) return { error: error.message };
  return {};
}

// Reorders in two passes (temporary negative positions, then final ones) so
// the sequential UPDATEs never collide with pack_items' UNIQUE(pack_id,
// position) constraint mid-reorder.
export async function reorderPackItems(packId: string, orderedItemIds: string[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const pack = await requireOwnedPack(packId, user.id);
  if (!pack) return { error: "Pack not found." };

  const passOne = await Promise.all(
    orderedItemIds.map((id, i) => supabase.from("pack_items").update({ position: -(i + 1) }).eq("id", id).eq("pack_id", packId))
  );
  const passOneError = passOne.find((r) => r.error);
  if (passOneError?.error) return { error: passOneError.error.message };

  const passTwo = await Promise.all(
    orderedItemIds.map((id, i) => supabase.from("pack_items").update({ position: i }).eq("id", id).eq("pack_id", packId))
  );
  const passTwoError = passTwo.find((r) => r.error);
  if (passTwoError?.error) return { error: passTwoError.error.message };

  revalidatePath(`/dashboard/packs/${packId}`);
  return {};
}

export async function releasePack(
  packId: string,
  changelog?: string
): Promise<{ error?: string; isFirstRelease?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const pack = await requireOwnedPack(packId, user.id);
  if (!pack) return { error: "Pack not found." };

  const { count: itemCount } = await supabase.from("pack_items").select("*", { count: "exact", head: true }).eq("pack_id", packId);
  if (!itemCount) return { error: "Add at least one prompt or skill before releasing." };

  const isFirstRelease = pack.status !== "published";

  if (isFirstRelease) {
    const { error } = await supabase
      .from("packs")
      .update({ status: "published", released_at: new Date().toISOString() })
      .eq("id", packId);
    if (error) return { error: error.message };
  } else {
    if (!changelog?.trim()) return { error: "A one-line changelog is required to push an update." };
    const nextVersion = pack.version + 1;
    const { error: versionError } = await supabase
      .from("pack_versions")
      .insert({ pack_id: packId, version: nextVersion, changelog: changelog.trim() });
    if (versionError) return { error: versionError.message };
    const { error: bumpError } = await supabase.from("packs").update({ version: nextVersion }).eq("id", packId);
    if (bumpError) return { error: bumpError.message };
  }

  revalidatePath(`/dashboard/packs/${packId}`);
  revalidatePath("/dashboard/packs");

  // Notification fan-out is triggered by the calling client component via
  // /api/packs/notify-release (same fire-and-forget pattern as the Living
  // Prompts trigger in submit-form.tsx) — a Server Action has no browser
  // cookies to forward, so it can't call that route itself.
  return { isFirstRelease };
}
