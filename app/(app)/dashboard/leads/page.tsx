import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertSettingsPanel } from "./alert-settings-panel";
import { LeadRow } from "./lead-row";
import { LeadKpiRow } from "./lead-kpi-row";
import { PipelineHero } from "./pipeline-hero";
import { ConversionFunnel } from "./conversion-funnel";
import { EngagementChart } from "./engagement-chart";
import { PromptPerformance } from "./prompt-performance";
import { eventLabel, suggestedAction, type LeadEvent } from "./lead-format";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const metadata: Metadata = {
  title: "Leads",
};

interface LeadDetail {
  user_id: string;
  score: number;
  stage: string;
  last_alerted_at: string | null;
  events: LeadEvent[];
}

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/leads");

  const [
    { data: leads },
    { data: alertSettings },
    { data: statsRows },
    { data: funnelRows },
    { data: engagementRows },
    { data: promptRows },
  ] = await Promise.all([
    supabase.rpc("get_my_leads"),
    supabase.from("creator_alert_settings").select("*").eq("creator_id", user.id).maybeSingle(),
    supabase.rpc("get_lead_stats"),
    supabase.rpc("get_lead_funnel"),
    supabase.rpc("get_engagement_series", { p_days: 14 }),
    supabase.rpc("get_prompt_performance"),
  ]);
  const leadList = leads ?? [];
  const stats = statsRows?.[0] ?? { reached: 0, hot_leads: 0, offer_clicks: 0, booked: 0 };
  const funnel = funnelRows?.[0] ?? { reached: 0, used: 0, hot: 0, clicked: 0, booked: 0 };
  const engagement = engagementRows ?? [];
  const promptPerformance = promptRows ?? [];
  const dealValue = alertSettings?.deal_value ?? null;

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
        events: events.map((e) => ({ label: eventLabel(e, titles), weight: e.weight, createdAt: e.created_at })),
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

      <div className="mb-8 space-y-6">
        <PipelineHero qualifyingLeads={stats.hot_leads} dealValue={dealValue} />

        <LeadKpiRow stats={stats} />

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Conversion funnel</h2>
          <ConversionFunnel stats={funnel} />
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Engagement over time</h2>
          <EngagementChart data={engagement} />
        </div>

        {promptPerformance.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-4 text-sm font-medium text-foreground">Prompt performance</h2>
            <p className="mb-3 -mt-2 text-xs text-muted-foreground">Ranked by which prompts produce buyers.</p>
            <PromptPerformance rows={promptPerformance} />
          </div>
        )}
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
            <LeadRow
              key={row.userId}
              userId={row.userId}
              score={row.score}
              stage={row.stage}
              updatedAt={row.updatedAt}
              sourceTitle={row.sourceTitle}
              events={row.events}
              suggestion={row.suggestion}
              offerSlot={defaultOfferSlot}
              cooldownUntil={row.cooldownUntil}
            />
          ))}
        </div>
      )}
    </div>
  );
}
