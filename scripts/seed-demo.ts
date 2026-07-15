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
const DEAL_VALUE = 2000;
const TOTAL_LEADS = 34;
const HOT_COUNT = 6;
const WARM_CLICK_COUNT = 3;
const BOOKED_COUNT = 2;
const PROMPT_WEIGHTS = [0.55, 0.3, 0.15];

// ---- content library seed (prompts / skills / packs) ----
// Marker: every demo-seeded prompt/skill/pack slug starts with this
// prefix, so unseed-demo.ts can find and remove them without touching
// torbs600's real content (the 3 original lead-scoring prompts, the
// original Salifly pack row itself).
const DEMO_SLUG_PREFIX = "demoseed-";
const SALIFLY_PACK_TITLE_MATCH = "salifly";
const NEW_PACK_SLUG = `${DEMO_SLUG_PREFIX}sales-workflow-toolkit`;

interface DemoPromptSeed {
  slug: string;
  title: string;
  description: string;
  body: string;
  variables: { name: string; type: string }[];
}

interface DemoSkillSeed {
  slug: string;
  name: string;
  summary: string;
  install_command: string;
  source_url: string;
  readme: string;
  category: string;
  runtimes: string[];
  tags: string[];
}

const DEMO_PROMPTS: DemoPromptSeed[] = [
  {
    slug: `${DEMO_SLUG_PREFIX}cold-outreach-first-touch`,
    title: "Cold Outreach — First Touch Email",
    description: "A short, personalized first-touch cold email built around the prospect's pain point.",
    body: "# Role\nA sharp, concise B2B sales rep writing a first-touch cold email.\n\n# Context\nProspect: {{prospect_name}} at {{company_name}}. Their likely pain point: {{pain_point}}. What we're offering: {{your_offer}}.\n\n# Task\nWrite a short, personalized first-touch cold email that opens with the prospect's specific pain point, connects it to the offer, and ends with a low-friction ask (a quick reply or a 15-minute call).\n\n# Output format\nA subject line and a 3-4 sentence email body. No fluff, no generic flattery.",
    variables: [
      { name: "prospect_name", type: "text" },
      { name: "company_name", type: "text" },
      { name: "pain_point", type: "text" },
      { name: "your_offer", type: "text" },
    ],
  },
  {
    slug: `${DEMO_SLUG_PREFIX}cold-outreach-follow-up`,
    title: "Cold Outreach — Follow-Up #2",
    description: "A brief, non-repetitive follow-up email for an unanswered first-touch cold email.",
    body: "# Role\nA persistent but respectful sales rep following up on an unanswered cold email.\n\n# Context\nProspect: {{prospect_name}}. What the first email covered: {{previous_email_summary}}. New angle to bring: {{new_angle}}.\n\n# Task\nWrite a brief follow-up email that doesn't repeat the first message, adds the new angle as fresh value, and makes it easy to say yes or no.\n\n# Output format\nA subject line and a 2-3 sentence email body.",
    variables: [
      { name: "prospect_name", type: "text" },
      { name: "previous_email_summary", type: "text" },
      { name: "new_angle", type: "text" },
    ],
  },
  {
    slug: `${DEMO_SLUG_PREFIX}objection-handling-response`,
    title: "Objection Handling Response",
    description: "Acknowledges a prospect's objection and moves the conversation back toward next steps.",
    body: "# Role\nA sales rep responding to a prospect's objection without sounding defensive.\n\n# Context\nThe objection raised: {{objection}}. Prospect: {{prospect_name}}. Product/service in question: {{product_name}}.\n\n# Task\nAcknowledge the objection directly, reframe it with a specific proof point or clarification, and move the conversation back toward next steps.\n\n# Output format\nA short reply (3-5 sentences) ready to send as-is.",
    variables: [
      { name: "objection", type: "text" },
      { name: "prospect_name", type: "text" },
      { name: "product_name", type: "text" },
    ],
  },
  {
    slug: `${DEMO_SLUG_PREFIX}linkedin-connection-dm`,
    title: "LinkedIn Connection Request DM",
    description: "A connection note under 300 characters that doesn't read like a template.",
    body: "# Role\nSomeone sending a LinkedIn connection request that doesn't read like a template.\n\n# Context\nProspect: {{prospect_name}}. Shared context or mutual connection: {{mutual_context}}. Sender's role: {{your_role}}.\n\n# Task\nWrite a connection note under 300 characters that references the shared context and gives a real reason to connect, with no pitch.\n\n# Output format\nOne short paragraph, no greeting or sign-off.",
    variables: [
      { name: "prospect_name", type: "text" },
      { name: "mutual_context", type: "text" },
      { name: "your_role", type: "text" },
    ],
  },
  {
    slug: `${DEMO_SLUG_PREFIX}linkedin-follow-up-dm`,
    title: "LinkedIn Follow-Up DM After Connect",
    description: "A casual, low-pressure first DM right after a LinkedIn connection is accepted.",
    body: "# Role\nA rep following up right after a LinkedIn connection request is accepted.\n\n# Context\nProspect: {{prospect_name}}. The value you can offer them: {{value_prop}}.\n\n# Task\nWrite a first DM that thanks them for connecting, briefly states the value prop in one sentence, and asks a genuine, low-pressure question.\n\n# Output format\nA 2-3 sentence DM, casual tone, no hard pitch.",
    variables: [
      { name: "prospect_name", type: "text" },
      { name: "value_prop", type: "text" },
    ],
  },
  {
    slug: `${DEMO_SLUG_PREFIX}sales-proposal-draft`,
    title: "Sales Proposal Draft",
    description: "A structured proposal draft — scope, pricing, and timeline — after a discovery call.",
    body: "# Role\nA sales rep drafting a proposal after a discovery call.\n\n# Context\nClient: {{client_name}}. Scope discussed: {{scope_summary}}. Pricing: {{pricing_details}}. Timeline: {{timeline}}.\n\n# Task\nDraft a short proposal that restates the client's goals, outlines the scope, states pricing clearly, and lays out the timeline with a clear next step.\n\n# Output format\nA structured proposal with headers: Overview, Scope, Pricing, Timeline, Next Steps.",
    variables: [
      { name: "client_name", type: "text" },
      { name: "scope_summary", type: "text" },
      { name: "pricing_details", type: "text" },
      { name: "timeline", type: "text" },
    ],
  },
];

const DEMO_SKILLS: DemoSkillSeed[] = [
  {
    slug: `${DEMO_SLUG_PREFIX}sales-email-qa`,
    name: "Sales Email QA",
    summary: "Reviews outbound sales emails for tone, clarity, and a clean CTA before you hit send.",
    install_command: "npx skills add prmpt-demo/sales-email-qa",
    source_url: "https://github.com/prmpt-demo/sales-email-qa",
    readme:
      "# Sales Email QA\n\nChecks an outbound sales email against a short rubric before it goes out: tone match, one clear CTA, no run-on paragraphs, subject line under 60 characters.\n\n**Triggers:** review this email, QA my outreach, check this before I send it.",
    category: "sales",
    runtimes: ["claude-code", "cowork"],
    tags: ["sales", "email", "qa"],
  },
  {
    slug: `${DEMO_SLUG_PREFIX}cold-outreach-workflow`,
    name: "Cold Outreach Workflow",
    summary:
      "Runs a full cold-outreach sequence — prospect research, first-touch email, and two scheduled follow-ups — from one command.",
    install_command: "npx skills add prmpt-demo/cold-outreach-workflow",
    source_url: "https://github.com/prmpt-demo/cold-outreach-workflow",
    readme:
      "# Cold Outreach Workflow\n\nGiven a prospect name and company, researches context, drafts a first-touch email, and schedules two follow-ups at sensible intervals.\n\n**Triggers:** start outreach to, cold email sequence for, follow-up plan for.",
    category: "sales",
    runtimes: ["claude-code", "cowork"],
    tags: ["sales", "outreach", "workflow"],
  },
  {
    slug: `${DEMO_SLUG_PREFIX}crm-cleanup`,
    name: "CRM Cleanup",
    summary: "Dedupes contacts, normalizes company names, and flags stale leads across your CRM export.",
    install_command: "npx skills add prmpt-demo/crm-cleanup",
    source_url: "https://github.com/prmpt-demo/crm-cleanup",
    readme:
      "# CRM Cleanup\n\nTakes a CRM export (CSV), dedupes contacts by email/name similarity, normalizes company names, and flags leads with no activity in 90+ days.\n\n**Triggers:** clean up this CRM export, dedupe my contacts, find stale leads.",
    category: "data",
    runtimes: ["claude-code", "cowork"],
    tags: ["crm", "data-cleanup", "sales-ops"],
  },
];

// Salifly pack (existing) gets 3 of the new prompts + 1 new skill appended.
// The new "Sales Workflow Toolkit" pack gets the remaining 3 prompts + 2 skills.
const SALIFLY_EXTENSION: { type: "prompt" | "skill"; slug: string; promiseLine: string }[] = [
  {
    type: "prompt",
    slug: `${DEMO_SLUG_PREFIX}cold-outreach-first-touch`,
    promiseLine: "Open cold with a first-touch email built around their exact pain point",
  },
  {
    type: "prompt",
    slug: `${DEMO_SLUG_PREFIX}cold-outreach-follow-up`,
    promiseLine: "Follow up without repeating yourself when the first email goes unanswered",
  },
  {
    type: "prompt",
    slug: `${DEMO_SLUG_PREFIX}objection-handling-response`,
    promiseLine: "Handle a prospect's objection and steer the conversation back to next steps",
  },
  {
    type: "skill",
    slug: `${DEMO_SLUG_PREFIX}sales-email-qa`,
    promiseLine: "QA every outbound email against a tone-and-CTA checklist before it sends",
  },
];

const NEW_PACK_ITEMS: { type: "prompt" | "skill"; slug: string; promiseLine: string }[] = [
  {
    type: "prompt",
    slug: `${DEMO_SLUG_PREFIX}linkedin-connection-dm`,
    promiseLine: "Send a connection request that doesn't read like a template",
  },
  {
    type: "prompt",
    slug: `${DEMO_SLUG_PREFIX}linkedin-follow-up-dm`,
    promiseLine: "Turn an accepted connection into a real conversation, no hard pitch",
  },
  {
    type: "prompt",
    slug: `${DEMO_SLUG_PREFIX}sales-proposal-draft`,
    promiseLine: "Draft a structured proposal straight out of a discovery call",
  },
  {
    type: "skill",
    slug: `${DEMO_SLUG_PREFIX}cold-outreach-workflow`,
    promiseLine: "Run an entire cold-outreach sequence — research, first touch, two follow-ups — in one shot",
  },
  {
    type: "skill",
    slug: `${DEMO_SLUG_PREFIX}crm-cleanup`,
    promiseLine: "Dedupe and clean a CRM export before it feeds back into outreach",
  },
];

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

async function upsertDemoPrompt(creatorId: string, seed: DemoPromptSeed, now: string): Promise<string> {
  const { data, error } = await supabase
    .from("prompts")
    .upsert(
      {
        author_id: creatorId,
        title: seed.title,
        slug: seed.slug,
        body: seed.body,
        description: seed.description,
        variables: seed.variables,
        status: "published",
        published_at: now,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`prompt upsert failed for ${seed.slug}: ${error.message}`);
  return data.id;
}

async function upsertDemoSkill(creatorId: string, seed: DemoSkillSeed, now: string): Promise<string> {
  const { data, error } = await supabase
    .from("skills")
    .upsert(
      {
        author_id: creatorId,
        name: seed.name,
        slug: seed.slug,
        summary: seed.summary,
        install_command: seed.install_command,
        source_url: seed.source_url,
        readme: seed.readme,
        category: seed.category,
        runtimes: seed.runtimes,
        tags: seed.tags,
        status: "published",
        published_at: now,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`skill upsert failed for ${seed.slug}: ${error.message}`);
  return data.id;
}

async function findSaliflyPackId(creatorId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("packs")
    .select("id, title")
    .eq("creator_id", creatorId)
    .ilike("title", `%${SALIFLY_PACK_TITLE_MATCH}%`)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Salifly pack lookup failed: ${error.message}`);
  return data?.id ?? null;
}

async function upsertNewPack(creatorId: string, now: string): Promise<string> {
  const { data, error } = await supabase
    .from("packs")
    .upsert(
      {
        creator_id: creatorId,
        title: "Sales Workflow Toolkit",
        slug: NEW_PACK_SLUG,
        liner_note: "The rest of the sales motion — LinkedIn, proposals, and the skills that run it end-to-end.",
        cover_type: "auto",
        accent: "#4E7B57",
        status: "published",
        gating: "free",
        released_at: now,
      },
      { onConflict: "creator_id,slug" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`Sales Workflow Toolkit pack upsert failed: ${error.message}`);
  return data.id;
}

/** Idempotent: skips if this pack already has an item pointing at this
 * prompt/skill, else appends it at the next free position. */
async function ensurePackItem(
  packId: string,
  itemType: "prompt" | "skill",
  itemId: string,
  promiseLine: string
): Promise<boolean> {
  const existingQuery = supabase.from("pack_items").select("id").eq("pack_id", packId);
  const { data: existing, error: existingErr } = await (itemType === "prompt"
    ? existingQuery.eq("prompt_id", itemId)
    : existingQuery.eq("skill_id", itemId)
  ).maybeSingle();

  if (existingErr) throw new Error(`pack_items lookup failed: ${existingErr.message}`);
  if (existing) return false;

  const { data: maxRow, error: maxErr } = await supabase
    .from("pack_items")
    .select("position")
    .eq("pack_id", packId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) throw new Error(`pack_items max-position lookup failed: ${maxErr.message}`);
  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { error: insertErr } = await supabase.from("pack_items").insert({
    pack_id: packId,
    item_type: itemType,
    prompt_id: itemType === "prompt" ? itemId : null,
    skill_id: itemType === "skill" ? itemId : null,
    position: nextPosition,
    promise_line: promiseLine,
  });

  if (insertErr) throw new Error(`pack_items insert failed: ${insertErr.message}`);
  return true;
}

async function seedContentLibrary(creator: { id: string; username: string }) {
  const now = new Date().toISOString();

  console.log("\nSeeding content library (prompts + skills + packs)...");

  const promptIdBySlug = new Map<string, string>();
  for (const seed of DEMO_PROMPTS) {
    promptIdBySlug.set(seed.slug, await upsertDemoPrompt(creator.id, seed, now));
  }
  console.log(`  Prompts upserted: ${DEMO_PROMPTS.length}`);

  const skillIdBySlug = new Map<string, string>();
  for (const seed of DEMO_SKILLS) {
    skillIdBySlug.set(seed.slug, await upsertDemoSkill(creator.id, seed, now));
  }
  console.log(`  Skills upserted: ${DEMO_SKILLS.length}`);

  const idForItem = (item: { type: "prompt" | "skill"; slug: string }) =>
    item.type === "prompt" ? promptIdBySlug.get(item.slug) : skillIdBySlug.get(item.slug);

  let saliflyItemsAdded = 0;
  const saliflyPackId = await findSaliflyPackId(creator.id);
  if (saliflyPackId) {
    for (const item of SALIFLY_EXTENSION) {
      const id = idForItem(item);
      if (!id) continue;
      const added = await ensurePackItem(saliflyPackId, item.type, id, item.promiseLine);
      if (added) saliflyItemsAdded += 1;
    }
    console.log(`  Salifly pack: ${saliflyItemsAdded} new item(s) added`);
  } else {
    console.log(`  No existing "Salifly" pack found for ${creator.username} — skipping that extension.`);
  }

  const newPackId = await upsertNewPack(creator.id, now);
  let newPackItemsAdded = 0;
  for (const item of NEW_PACK_ITEMS) {
    const id = idForItem(item);
    if (!id) continue;
    const added = await ensurePackItem(newPackId, item.type, id, item.promiseLine);
    if (added) newPackItemsAdded += 1;
  }
  console.log(`  Sales Workflow Toolkit pack: ${newPackItemsAdded} new item(s) added (id: ${newPackId})`);

  return {
    promptsUpserted: DEMO_PROMPTS.length,
    skillsUpserted: DEMO_SKILLS.length,
    saliflyItemsAdded,
    newPackItemsAdded,
    saliflyPackFound: saliflyPackId !== null,
  };
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

  const libraryResult = await seedContentLibrary(creator);

  console.log("\nDone. Summary:");
  console.log(`  Creator: ${creator.username}`);
  console.log(`  deal_value: $${DEAL_VALUE}`);
  console.log(`  Prompts seeded against (lead events): ${prompts.length}`);
  console.log(`  Fake leads created: ${plans.length}`);
  console.log(`  Hot leads (decayed score >= 50): ${hotCount}`);
  console.log(`  Leads with an offer_click: ${offerClickLeads}`);
  console.log(`  Booked leads: ${bookedCount}`);
  console.log(`  Events by type:`, eventTypeCounts);
  console.log(
    `  Estimated pipeline: ${hotCount} hot x $${DEAL_VALUE} = $${(hotCount * DEAL_VALUE).toLocaleString()}`
  );
  console.log(`  Content library — new prompts: ${libraryResult.promptsUpserted}`);
  console.log(`  Content library — new skills: ${libraryResult.skillsUpserted}`);
  console.log(
    `  Content library — Salifly pack extended: ${
      libraryResult.saliflyPackFound ? `${libraryResult.saliflyItemsAdded} item(s)` : "pack not found, skipped"
    }`
  );
  console.log(`  Content library — Sales Workflow Toolkit pack items added: ${libraryResult.newPackItemsAdded}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
