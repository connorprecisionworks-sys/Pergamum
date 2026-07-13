"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * A per-prompt override. Same manual select-then-write shape as the default
 * slot in app/creator/onboarding/actions.ts, mirroring its own partial
 * unique index (creator_id, prompt_id) WHERE prompt_id IS NOT NULL — a
 * plain .upsert({...}, {onConflict}) doesn't match a partial index.
 */
export async function savePromptOfferSlot(
  promptId: string,
  input: { label: string; url: string; description: string | null }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const label = input.label.trim();
  const url = input.url.trim();
  if (!label) return { error: "Give your button a label." };
  if (!url) return { error: "Add a link for people to book or reach you." };

  const { data: prompt } = await supabase
    .from("prompts")
    .select("id")
    .eq("id", promptId)
    .eq("author_id", user.id)
    .maybeSingle();
  if (!prompt) return { error: "That prompt isn't yours." };

  const { data: existing } = await supabase
    .from("offer_slots")
    .select("id")
    .eq("creator_id", user.id)
    .eq("prompt_id", promptId)
    .maybeSingle();

  const description = input.description?.trim() || null;

  const { error } = existing
    ? await supabase.from("offer_slots").update({ label, url, description }).eq("id", existing.id)
    : await supabase.from("offer_slots").insert({ creator_id: user.id, prompt_id: promptId, label, url, description });

  if (error) return { error: "Couldn't save that. Try again." };
  revalidatePath("/dashboard/offers");
  return {};
}

export async function deleteOfferSlot(slotId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("offer_slots")
    .delete()
    .eq("id", slotId)
    .eq("creator_id", user.id);

  if (error) return { error: "Couldn't remove that. Try again." };
  revalidatePath("/dashboard/offers");
  return {};
}

export async function toggleOfferSlotActive(slotId: string, active: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("offer_slots")
    .update({ active })
    .eq("id", slotId)
    .eq("creator_id", user.id);

  if (error) return { error: "Couldn't update that. Try again." };
  revalidatePath("/dashboard/offers");
  return {};
}
