"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/utils";

/** Step 1 — "What do you help people with?" Writes profiles.offer_headline. */
export async function saveOfferHeadline(headline: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = headline.trim();
  if (!trimmed) return { error: "Tell people what you help with to continue." };

  const { error } = await supabase
    .from("profiles")
    .update({ offer_headline: trimmed.slice(0, 200) })
    .eq("id", user.id);

  if (error) return { error: "Couldn't save that. Try again." };
  return {};
}

/**
 * Step 3 — the default offer slot (prompt_id = null). Manual select-then-
 * write rather than .upsert(): the "one default per creator" rule is a
 * partial unique index (WHERE prompt_id IS NULL), which Postgres only
 * matches on ON CONFLICT when the predicate is included — the plain
 * column-list upsert Supabase's client sends does not include it.
 */
export async function saveOfferSlot(input: {
  label: string;
  url: string;
  description: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const label = input.label.trim();
  if (!label) return { error: "Give your button a label." };
  if (!input.url.trim()) return { error: "Add a link for people to book or reach you." };
  const url = normalizeUrl(input.url);
  if (!url) return { error: "That link doesn't look like a valid URL." };

  const { data: existing } = await supabase
    .from("offer_slots")
    .select("id")
    .eq("creator_id", user.id)
    .is("prompt_id", null)
    .maybeSingle();

  const description = input.description?.trim() || null;

  const { error } = existing
    ? await supabase
        .from("offer_slots")
        .update({ label, url, description })
        .eq("id", existing.id)
    : await supabase
        .from("offer_slots")
        .insert({ creator_id: user.id, prompt_id: null, label, url, description });

  if (error) return { error: "Couldn't save that. Try again." };
  return {};
}

/** Step 4 — alert preferences. creator_id is the primary key, so a plain upsert is safe. */
export async function saveAlertSettings(input: {
  hotThreshold: number;
  inApp: boolean;
  email: boolean;
  emailMode: "instant" | "daily_digest";
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("creator_alert_settings").upsert(
    {
      creator_id: user.id,
      hot_threshold: input.hotThreshold,
      in_app: input.inApp,
      email: input.email,
      email_mode: input.emailMode,
    },
    { onConflict: "creator_id" }
  );

  if (error) return { error: "Couldn't save that. Try again." };
  return {};
}

/** Step 5 — the payoff. Finishes onboarding regardless of which optional steps were skipped. */
export async function completeCreatorOnboarding(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ creator_onboarding_complete: true })
    .eq("id", user.id);

  if (error) return { error: "Couldn't finish that. Try again." };

  // analytics_events table is not in generated types until migration runs
  // eslint-disable-next-line
  await (supabase as any).from("analytics_events").insert({
    event: "creator_onboarding_completed",
    user_id: user.id,
  });

  return {};
}
