/**
 * Demo seed script — populates torbs600's dashboard with believable fake
 * lead activity so /dashboard/leads has something to show on camera.
 * See DEMO-PLAN.md for the target numbers and talk track this backs.
 *
 * Uses the Supabase service-role client directly (not the CLI), so it
 * works even while the CLI is down. Run with:
 *   npx tsx scripts/seed-demo.ts
 *
 * Teardown: npx tsx scripts/unseed-demo.ts
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

process.loadEnvFile(".env.local");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL_DOMAIN = "prmpt-demo.test";
const DEMO_EMAIL_PREFIX = "demoseed+";
const TARGET_USERNAME = "user_20c5de1f";
const TARGET_EMAIL = "torbs600@gmail.com";
const DEAL_VALUE = 5000;
const TOTAL_LEADS = 34;
const HOT_COUNT = 8;
const WARM_CLICK_COUNT = 4;
const BOOKED_COUNT = 3;
const PROMPT_WEIGHTS = [0.55, 0.3, 0.15];

type LeadEventType =
  | "claim"
  | "prompt_run"
  | "preset_saved"
  | "follow"
  | "return_visit"
  | "offer_click";

interface SeedEvent {
  event_type: LeadEventType;
  weight: number;
  prompt_id: string | null;
  daysAgo: number;
}

interface LeadPlan {
  n: number;
  events: SeedEvent[];
  booked: boolean;
}

const HALF_LIFE_DAYS = 7;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Days-ago offset in [0, maxDays], skewed toward 0 (recent) so the trailing
 * engagement chart trends up toward today. */
function skewedDaysAgo(maxDays: number): number {
  return Math.floor(Math.pow(Math.random(), 1.6) * (maxDays + 1));
}

function jitteredTimestamp(daysAgo: number, now: number): string {
  const ms = now - daysAgo * 86_400_000 - randomInt(0, 86_400_000 - 1);
  return new Date(ms).toISOString();
}

function decayedScore(events: SeedEvent[], now: number): number {
  return events.reduce((sum, e) => {
    const createdMs = now - e.daysAgo * 86_400_000;
    const ageDays = (now - createdMs) / 86_400_000;
    return sum + e.weight * Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
  }, 0);
}

function stageFor(score: number): "hot" | "warm" | "cold" {
  if (score >= 50) return "hot";
  if (score >= 25) return "warm";
  return "cold";
}

function weightedPromptIndex(promptCount: number): number {
  const weights = PROMPT_WEIGHTS.slice(0, promptCount);
  const total = weights.reduce((a, b) => a + b, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r <= acc) return i;
  }
  return weights.length - 1;
}

function buildHotLeadEvents(n: number, promptIds: string[]): SeedEvent[] {
  const primary = promptIds[weightedPromptIndex(promptIds.length)];
  const claimDay = randomInt(6, 13);
  const events: SeedEvent[] = [
    { event_type: "claim", weight: 10, prompt_id: primary, daysAgo: claimDay },
    {
      event_type: "prompt_run",
      weight: n % 3 === 0 ? 12 : 8,
      prompt_id: primary,
      daysAgo: Math.max(claimDay - 1, 0),
    },
    {
      event_type: "prompt_run",
      weight: 5,
      prompt_id: primary,
      daysAgo: randomInt(2, Math.max(claimDay - 2, 2)),
    },
  ];

  if (n % 3 === 0) {
    events.push({
      event_type: "preset_saved",
      weight: 8,
      prompt_id: primary,
      daysAgo: randomInt(1, 4),
    });
  }

  events.push({
    event_type: "follow",
    weight: 35,
    prompt_id: null,
    daysAgo: randomInt(1, Math.max(claimDay - 1, 1)),
  });
  events.push({
    event_type: "return_visit",
    weight: 12,
    prompt_id: null,
    daysAgo: randomInt(0, 2),
  });
  events.push({
    event_type: "offer_click",
    weight: 30,
    prompt_id: primary,
    daysAgo: randomInt(0, 2),
  });

  return events;
}

function buildWarmClickLeadEvents(promptIds: string[]): SeedEvent[] {
  const primary = promptIds[weightedPromptIndex(promptIds.length)];
  const claimDay = randomInt(4, 6);
  return [
    { event_type: "claim", weight: 10, prompt_id: primary, daysAgo: claimDay },
    { event_type: "prompt_run", weight: 8, prompt_id: primary, daysAgo: claimDay - 1 },
    {
      event_type: "offer_click",
      weight: 30,
      prompt_id: primary,
      daysAgo: randomInt(1, 3),
    },
  ];
}

function buildTailLeadEvents(promptIds: string[]): SeedEvent[] {
  const primary = promptIds[weightedPromptIndex(promptIds.length)];
  const claimDay = skewedDaysAgo(13) + 2; // keep tail leads a bit older than the hot cluster
  const events: SeedEvent[] = [
    { event_type: "claim", weight: 10, prompt_id: primary, daysAgo: claimDay },
    {
      event_type: "prompt_run",
      weight: 8,
      prompt_id: primary,
      daysAgo: Math.max(claimDay - 1, 0),
    },
  ];

  // ~1/3 of the tail gets a second, repeat run — still a cold/low-warm lead.
  if (Math.random() < 0.36) {
    events.push({
      event_type: "prompt_run",
      weight: 5,
      prompt_id: primary,
      daysAgo: Math.max(claimDay - 2, 0),
    });
  }

  return events;
}

async function resolveCreator() {
  const byUsername = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", TARGET_USERNAME)
    .maybeSingle();

  if (byUsername.data) return byUsername.data;

  console.log(`No profile found for username ${TARGET_USERNAME}, falling back to email lookup...`);

  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find((u) => u.email === TARGET_EMAIL);
    if (match) {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", match.id)
        .single();
      if (profileErr) throw new Error(`profile lookup failed: ${profileErr.message}`);
      return profile;
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  throw new Error(
    `Could not resolve creator by username "${TARGET_USERNAME}" or email "${TARGET_EMAIL}"`
  );
}

async function getOrCreateFakeLead(n: number): Promise<string> {
  const email = `${DEMO_EMAIL_PREFIX}${n}@${DEMO_EMAIL_DOMAIN}`;

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { demo_seed: true },
  });

  if (!error && created.user) return created.user.id;

  // Already exists (re-running the seed) — look it up instead of failing.
  if (error && /already registered|already exists/i.test(error.message)) {
    let page = 1;
    const perPage = 200;
    for (;;) {
      const { data, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage });
      if (listErr) throw new Error(`listUsers failed while resolving ${email}: ${listErr.message}`);
      const match = data.users.find((u) => u.email === email);
      if (match) return match.id;
      if (data.users.length < perPage) break;
      page += 1;
    }
  }

  throw new Error(`createUser failed for ${email}: ${error?.message ?? "unknown error"}`);
}

async function main() {
  console.log("Resolving creator...");
  const creator = await resolveCreator();
  console.log(`Creator: ${creator.username} (${creator.id})`);

  const { data: prompts, error: promptsErr } = await supabase
    .from("prompts")
    .select("id, title")
    .eq("author_id", creator.id)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (promptsErr) throw new Error(`prompts lookup failed: ${promptsErr.message}`);
  if (!prompts || prompts.length === 0) {
    throw new Error(`Creator ${creator.username} has no published prompts to seed events against.`);
  }

  const promptIds = prompts.map((p) => p.id);
  console.log(`Found ${prompts.length} published prompt(s): ${prompts.map((p) => p.title).join(", ")}`);

  console.log(`Setting deal_value = $${DEAL_VALUE} for ${creator.username}...`);
  const { error: settingsErr } = await supabase
    .from("creator_alert_settings")
    .upsert({ creator_id: creator.id, deal_value: DEAL_VALUE }, { onConflict: "creator_id" });
  if (settingsErr) throw new Error(`creator_alert_settings upsert failed: ${settingsErr.message}`);

  // ---- build the 34-lead plan ----
  const plans: LeadPlan[] = [];
  for (let n = 1; n <= HOT_COUNT; n++) {
    plans.push({ n, events: buildHotLeadEvents(n, promptIds), booked: n <= BOOKED_COUNT });
  }
  for (let i = 0; i < WARM_CLICK_COUNT; i++) {
    const n = HOT_COUNT + i + 1;
    plans.push({ n, events: buildWarmClickLeadEvents(promptIds), booked: false });
  }
  for (let i = 0; i < TOTAL_LEADS - HOT_COUNT - WARM_CLICK_COUNT; i++) {
    const n = HOT_COUNT + WARM_CLICK_COUNT + i + 1;
    plans.push({ n, events: buildTailLeadEvents(promptIds), booked: false });
  }

  console.log(`Creating ${plans.length} fake lead accounts and their events...`);

  const now = Date.now();
  let hotCount = 0;
  let offerClickLeads = 0;
  let bookedCount = 0;
  const eventTypeCounts: Record<string, number> = {};

  for (const plan of plans) {
    const leadId = await getOrCreateFakeLead(plan.n);

    const rows = plan.events.map((e) => ({
      creator_id: creator.id,
      user_id: leadId,
      event_type: e.event_type,
      weight: e.weight,
      prompt_id: e.prompt_id,
      pack_id: null,
      meta: {},
      created_at: jitteredTimestamp(e.daysAgo, now),
    }));

    const { error: insertErr } = await supabase.from("lead_events").insert(rows);
    if (insertErr) throw new Error(`lead_events insert failed for lead ${plan.n}: ${insertErr.message}`);

    for (const e of plan.events) {
      eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] ?? 0) + 1;
    }

    const score = decayedScore(plan.events, now);
    const stage = stageFor(score);
    if (stage === "hot") hotCount += 1;
    if (plan.events.some((e) => e.event_type === "offer_click")) offerClickLeads += 1;

    const offerClickEvent = [...plan.events]
      .filter((e) => e.event_type === "offer_click")
      .sort((a, b) => a.daysAgo - b.daysAgo)[0];

    const { error: alertErr } = await supabase.from("lead_alert_state").upsert(
      {
        creator_id: creator.id,
        user_id: leadId,
        stage,
        last_score: score,
        last_alerted_at: offerClickEvent ? jitteredTimestamp(offerClickEvent.daysAgo, now) : null,
        booked_at: plan.booked ? new Date(now).toISOString() : null,
      },
      { onConflict: "creator_id,user_id" }
    );
    if (alertErr) throw new Error(`lead_alert_state upsert failed for lead ${plan.n}: ${alertErr.message}`);

    if (plan.booked) bookedCount += 1;
  }

  console.log("\nDone. Summary:");
  console.log(`  Creator: ${creator.username}`);
  console.log(`  deal_value: $${DEAL_VALUE}`);
  console.log(`  Prompts seeded against: ${prompts.length}`);
  console.log(`  Fake leads created: ${plans.length}`);
  console.log(`  Hot leads (decayed score >= 50): ${hotCount}`);
  console.log(`  Leads with an offer_click: ${offerClickLeads}`);
  console.log(`  Booked leads: ${bookedCount}`);
  console.log(`  Events by type:`, eventTypeCounts);
  console.log(
    `  Estimated pipeline: ${hotCount} hot x $${DEAL_VALUE} = $${(hotCount * DEAL_VALUE).toLocaleString()}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
