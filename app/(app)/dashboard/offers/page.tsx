import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OffersManager } from "./offers-manager";

export const metadata: Metadata = {
  title: "Offers",
};

export default async function OffersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/offers");

  const [{ data: slots }, { data: prompts }] = await Promise.all([
    supabase
      .from("offer_slots")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("prompts")
      .select("id, title")
      .eq("author_id", user.id)
      .eq("status", "published")
      .order("title"),
  ]);

  const allSlots = slots ?? [];
  const defaultSlot = allSlots.find((s) => s.prompt_id === null) ?? null;
  const promptSlots = allSlots.filter((s) => s.prompt_id !== null);

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight font-serif">Offers</h1>
        <p className="mt-1 text-muted-foreground">
          The button that appears right after someone uses your prompt. Per-prompt overrides
          beat the default when both exist.
        </p>
      </div>

      <OffersManager
        defaultSlot={defaultSlot}
        promptSlots={promptSlots}
        publishedPrompts={prompts ?? []}
      />
    </div>
  );
}
