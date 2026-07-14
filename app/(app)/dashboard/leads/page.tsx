import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertSettingsPanel } from "./alert-settings-panel";
import { SendOfferButton } from "./send-offer-button";
import { relativeTime } from "@/lib/utils";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const metadata: Metadata = {
  title: "Leads",
};

interface LeadEvent {
  event_type: string;
  weight: number;
  prompt_id: string | null;
  pack_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

interface LeadDetail {
  user_id: string;
  score: number;
  stage: string;
  last_alerted_at: string | null;
  events: LeadEvent[];
}

const STAGE_LABEL: Record<string, string> = { hot: "Hot", warm: "Warm", cold: "Cold" };
const STAGE_DOT: Record<string, string> = {
  hot: "bg-destructive",
  warm: "bg-amber-500",
  cold: "bg-foreground-subtle",
};

function leadHandle(userId: string): string {
  return `Lead #${userId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** Deterministic HSL from the user id — a stable "generated avatar" with no external service. */
function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360}, 55%, 88%)`;
}

function eventLabel(
  event: LeadEvent,
  titles: Map<string, string>
): string {
  const promptTitle = event.prompt_id ? titles.get(`prompt:${event.prompt_id}`) : null;
  const packTitle = event.pack_id ? titles.get(`pack:${event.pack_id}`) : null;

  switch (event.event_type) {
    case "claim":
      return promptTitle ? `Claimed "${promptTitle}"` : "Claimed your link";
    case "prompt_run": {
      const filled = typeof event.meta?.vars_filled_pct === "number" && event.meta.vars_filled_pct >= 80;
      const base = promptTitle ? `Ran "${promptTitle}"` : "Ran a prompt";
      return filled ? `${base} with real inputs` : base;
    }
    case "preset_saved":
      return promptTitle ? `Saved a preset for "${promptTitle}"` : "Saved a preset";
    case "item_saved":
      return promptTitle ? `Saved "${promptTitle}"` : packTitle ? `Saved "${packTitle}"` : "Saved an item";
    case "follow":
      return "Followed you";
    case "return_visit":
      return "Came back on a new day";
    case "pack_completed":
      return packTitle ? `Completed "${packTitle}"` : "Completed a pack";
    case "velocity_bonus":
      return "Ran it within minutes of claiming";
    case "offer_view":
      return "Saw your offer button";
    case "offer_click":
      return "Clicked your offer button";
    default:
      return event.event_type;
  }
}

interface SuggestedAction {
  text: string;
  href?: string;
}

function suggestedAction(stage: string, hasOfferClick: boolean, hasAnyOfferSlot: boolean): SuggestedAction | null {
  if (hasOfferClick) return { text: "They clicked your offer button. Follow up on the booking." };
  if (stage === "hot" && hasAnyOfferSlot) {
    return { text: "Hot and hasn't clicked your offer yet. Consider a direct nudge in your next post." };
  }
  if (stage === "hot" && !hasAnyOfferSlot) {
    return { text: "Add an offer slot. This lead has nowhere to say yes.", href: "/dashboard/offers" };
  }
  if (stage === "warm") return { text: "Watch. An alert fires if they return." };
  return null;
}

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/leads");

  const { data: leads } = await supabase.rpc("get_my_leads");
  const leadList = leads ?? [];

  const { data: alertSettings } = await supabase
    .from("creator_alert_settings")
    .select("*")
    .eq("creator_id", user.id)
    .maybeSingle();

  const [{ data: offerSlots }, { data: defaultOfferSlot }, { data: recentMessages }, detailResults] =
    await Promise.all([
      supabase.from("offer_slots").select("id").eq("creator_id", user.id).limit(1),
      supabase
        .from("offer_slots")
        .select("id, label")
        .eq("creator_id", user.id)
        .is("prompt_id", null)
        .maybeSingle(),
      supabase
        .from("lead_messages")
        .select("lead_user_id, created_at")
        .eq("creator_id", user.id)
        .gte("created_at", new Date(Date.now() - COOLDOWN_MS).toISOString()),
      Promise.all(leadList.map((l) => supabase.rpc("get_lead_detail", { p_user_id: l.user_id }))),
    ]);

  const hasAnyOfferSlot = (offerSlots?.length ?? 0) > 0;
  const details = detailResults
    .map((r) => r.data as LeadDetail | null)
    .filter((d): d is LeadDetail => d !== null);

  // At most one row per lead can exist in this 24h window — the RPC's own
  // cooldown check rejects a second send before it, so no MAX() needed.
  const cooldownByLead = new Map<string, string>();
  for (const m of recentMessages ?? []) {
    cooldownByLead.set(m.lead_user_id, new Date(new Date(m.created_at).getTime() + COOLDOWN_MS).toISOString());
  }

  const promptIds = new Set<string>();
  const packIds = new Set<string>();
  for (const d of details) {
    for (const e of d.events) {
      if (e.prompt_id) promptIds.add(e.prompt_id);
      if (e.pack_id) packIds.add(e.pack_id);
    }
  }

  const [{ data: prompts }, { data: packs }] = await Promise.all([
    promptIds.size > 0
      ? supabase.from("prompts").select("id, title").in("id", Array.from(promptIds))
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    packIds.size > 0
      ? supabase.from("packs").select("id, title").in("id", Array.from(packIds))
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const titles = new Map<string, string>();
  for (const p of prompts ?? []) titles.set(`prompt:${p.id}`, p.title);
  for (const p of packs ?? []) titles.set(`pack:${p.id}`, p.title);

  const rows = leadList
    .map((l) => {
      const detail = details.find((d) => d.user_id === l.user_id);
      const events = detail?.events ?? [];
      const claimEvent = events.find((e) => e.event_type === "claim");
      const sourceTitle = claimEvent
        ? (claimEvent.prompt_id && titles.get(`prompt:${claimEvent.prompt_id}`)) ||
          (claimEvent.pack_id && titles.get(`pack:${claimEvent.pack_id}`)) ||
          null
        : null;
      const hasOfferClick = events.some((e) => e.event_type === "offer_click");

      return {
        userId: l.user_id,
        score: l.score,
        stage: l.stage,
        updatedAt: l.updated_at,
        events,
        sourceTitle,
        suggestion: suggestedAction(l.stage, hasOfferClick, hasAnyOfferSlot),
        cooldownUntil: cooldownByLead.get(l.user_id) ?? null,
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-medium tracking-tight font-serif">Leads</h1>
        <p className="mt-1 text-muted-foreground">
          Everyone who&rsquo;s used your prompts, ranked by how likely they are to hire you.
        </p>
      </div>

      <div className="mb-8">
        <AlertSettingsPanel initial={alertSettings ?? null} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Flame className="h-6 w-6 text-muted-foreground" />}
          title="No leads yet"
          description="Leads appear when people claim and run your prompts. Post a comment-to-DM play to fill this."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.userId} className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback style={{ backgroundColor: avatarColor(row.userId) }} className="text-[11px] font-medium">
                    {leadHandle(row.userId).slice(-2)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{leadHandle(row.userId)}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                      <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[row.stage] ?? "bg-foreground-subtle"}`} />
                      {STAGE_LABEL[row.stage] ?? row.stage}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{Math.round(row.score)}</span>
                    <span className="text-xs text-muted-foreground">
                      · last active {relativeTime(row.updatedAt)}
                    </span>
                  </div>

                  {row.sourceTitle && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Came from <span className="font-medium text-foreground">{row.sourceTitle}</span>
                    </p>
                  )}

                  {row.events.length > 0 && (
                    <ul className="mt-2.5 space-y-1 text-sm text-muted-foreground">
                      {row.events.slice(0, 6).map((e, i) => (
                        <li key={i}>
                          {eventLabel(e, titles)} · {relativeTime(e.created_at)}
                        </li>
                      ))}
                    </ul>
                  )}

                  {row.suggestion &&
                    (row.suggestion.href ? (
                      <Link
                        href={row.suggestion.href}
                        className="mt-3 block rounded-md bg-secondary/60 px-3 py-2 text-xs text-foreground underline-offset-2 hover:underline"
                      >
                        {row.suggestion.text}
                      </Link>
                    ) : (
                      <p className="mt-3 rounded-md bg-secondary/60 px-3 py-2 text-xs text-foreground">
                        {row.suggestion.text}
                      </p>
                    ))}

                  <SendOfferButton
                    leadUserId={row.userId}
                    offerSlot={defaultOfferSlot}
                    cooldownUntil={row.cooldownUntil}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
