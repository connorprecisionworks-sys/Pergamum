import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatorOnboardingForm } from "@/components/onboarding/creator-onboarding-form";

export const metadata: Metadata = {
  title: "Set up your creator page",
};

export default async function CreatorOnboardingPage() {
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

  // Only a creator lane belongs here. account_type === null goes through the
  // picker first; a client never reaches this route via the gate, but guard
  // it directly too since it's a typeable URL.
  if (profile.account_type === null) redirect("/welcome");
  if (profile.account_type === "client") redirect("/dashboard");
  if (profile.creator_onboarding_complete) redirect("/dashboard");

  const [{ data: publishedPacksRaw }, { data: offerSlot }, { data: alertSettings }] = await Promise.all([
    supabase
      .from("packs")
      .select("id, slug, released_at, created_at")
      .eq("creator_id", user.id)
      .eq("status", "published")
      .order("released_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("offer_slots")
      .select("*")
      .eq("creator_id", user.id)
      .is("prompt_id", null)
      .maybeSingle(),
    supabase
      .from("creator_alert_settings")
      .select("*")
      .eq("creator_id", user.id)
      .maybeSingle(),
  ]);

  const publishedPacks = publishedPacksRaw ?? [];
  const hasPublishedPack = publishedPacks.length > 0;

  // Point the share link at the pack the creator actually built, not just
  // any published pack — .limit(1) with no ordering used to return an
  // arbitrary one, which could be an empty "Untitled pack". publishedPacks
  // is already ordered released_at desc nulls last, created_at desc, so
  // .find() below returns the most recent match; fall back to the most
  // recent published pack overall if none of them have items yet.
  let publishedPackSlug: string | null = null;
  if (hasPublishedPack) {
    const { data: itemRows } = await supabase
      .from("pack_items")
      .select("pack_id")
      .in("pack_id", publishedPacks.map((p) => p.id));
    const packIdsWithItems = new Set((itemRows ?? []).map((r) => r.pack_id));
    const packWithItems = publishedPacks.find((p) => packIdsWithItems.has(p.id));
    publishedPackSlug = (packWithItems ?? publishedPacks[0]).slug;
  }

  // Data-driven resume, not a ?step= param: each condition only advances the
  // step further, so reloading mid-flow (or returning from the pack builder
  // in another tab, having published) always lands on the furthest step
  // actually reached — "resume at Step 3" after a publish falls out of this
  // naturally rather than needing separate round-trip plumbing.
  let initialStep = 0;
  if (profile.offer_headline) initialStep = 1;
  if (hasPublishedPack) initialStep = 2;
  if (offerSlot) initialStep = 3;
  if (alertSettings) initialStep = 4;

  return (
    <CreatorOnboardingForm
      username={profile.username}
      initialStep={initialStep}
      initialOfferHeadline={profile.offer_headline}
      hasPublishedPack={hasPublishedPack}
      publishedPackSlug={publishedPackSlug}
      initialOfferSlot={
        offerSlot
          ? {
              title: offerSlot.title,
              label: offerSlot.label,
              url: offerSlot.url,
              description: offerSlot.description,
              imageUrl: offerSlot.image_url,
            }
          : null
      }
      initialAlertSettings={
        alertSettings
          ? {
              hotThreshold: alertSettings.hot_threshold,
              inApp: alertSettings.in_app,
              email: alertSettings.email,
              emailMode: alertSettings.email_mode,
            }
          : null
      }
    />
  );
}
