/**
 * Demo identity seed — Phase 3 of the identity-tier build. Updates the
 * ~34 fake leads already created by scripts/seed-demo.ts in place:
 * does NOT touch lead_events or lead_alert_state.last_score/stage —
 * only identity_consented, profiles.display_name, and user_attributes.
 *
 * Requires migration 0030_identity_tier.sql applied first (profiles.plan,
 * lead_alert_state.identity_consented).
 *
 * Run with: npx tsx scripts/seed-lead-identity.ts
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

const DEMO_EMAIL_PREFIX = "demoseed+";
const DEMO_EMAIL_DOMAIN = "prmpt-demo.test";
const TARGET_USERNAME = "user_20c5de1f";
const TARGET_EMAIL = "torbs600@gmail.com";

type RoleCategory = Database["public"]["Enums"]["role_category_enum"];
type Industry = Database["public"]["Enums"]["industry_enum"];

// The 3 prompts the original seed-demo.ts lead_events actually reference
// (the "sales email" pack, not the later cold-outreach/LinkedIn/proposal
// content-library prompts, which no fake lead has ever run). Each lead's
// role is inferred from whichever of these 3 they primarily engaged
// with, mapped to the closest real-world persona:
//   Product Promotion (outbound pitch)   -> SDR / AE / founder
//   Summary + Next Steps (live deal)     -> AE / sales manager
//   Weekly Report (reporting/analysis)   -> consultant / ops
const PROMPT_SLUG_ROLE_POOL: Record<
  string,
  { titles: string[]; roleCategory: RoleCategory }
> = {
  "sales-email-for-product-promotion": {
    titles: ["SDR", "Account Executive", "Founder", "Head of Sales"],
    roleCategory: "sales_bd",
  },
  "sales-email-summary-and-next-steps": {
    titles: ["Account Executive", "Sales Manager", "BDR"],
    roleCategory: "sales_bd",
  },
  "weekly-sales-report-email": {
    titles: ["Sales Consultant", "RevOps Analyst", "Sales Operations Manager", "Independent Consultant"],
    roleCategory: "consultant_coach",
  },
};
const DEFAULT_ROLE_POOL = PROMPT_SLUG_ROLE_POOL["sales-email-summary-and-next-steps"];

const INDUSTRIES: Industry[] = [
  "saas_tech",
  "agency_consulting",
  "marketing_media",
  "ecommerce_retail",
  "coaching_education",
  "finance_insurance",
];

const COMPANIES = [
  "Northbeam Analytics",
  "Fielder Digital",
  "Vantage Outbound",
  "Crestline Solutions",
  "Loopstack",
  "Brightpath Consulting",
  "Harborline Media",
  "Greymark Partners",
  "Solace Growth",
  "Ridgeway Sales Co.",
  "Pinecrest Advisory",
  "Fernbrook Group",
  "Anchorwell Systems",
  "Lucent Outreach",
  "Kindling Studio",
  "Ovalstone Ventures",
  "Meridian Bridge",
  "Cobalt Path",
  "Stillwater Consulting",
  "Ampersand Sales",
];

const FIRST_NAMES = [
  "Jordan", "Casey", "Morgan", "Taylor", "Avery", "Riley", "Cameron", "Reese",
  "Dana", "Quinn", "Sydney", "Rowan", "Harper", "Emerson", "Skyler", "Devin",
  "Blake", "Elliot", "Marlowe", "Sasha",
];
const LAST_NAMES = [
  "Ellis", "Bennett", "Marsh", "Whitfield", "Doyle", "Sinclair", "Voss", "Prentiss",
  "Calloway", "Okafor", "Renner", "Hartley", "Fenwick", "Colton", "Reyes", "Winslow",
  "Abara", "Novak", "Pruitt", "Larkin",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function resolveCreator(): Promise<{ id: string; username: string }> {
  const byUsername = await supabase.from("profiles").select("id, username").eq("username", TARGET_USERNAME).maybeSingle();
  if (byUsername.data) return byUsername.data;

  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find((u) => u.email === TARGET_EMAIL);
    if (match) {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", match.id)
        .single();
      if (profileErr) throw new Error(`profile lookup failed: ${profileErr.message}`);
      return profile;
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  throw new Error(`Could not resolve creator by username "${TARGET_USERNAME}" or email "${TARGET_EMAIL}"`);
}

async function getDemoLeadIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    for (const u of data.users) {
      if (u.email?.startsWith(DEMO_EMAIL_PREFIX) && u.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)) {
        ids.add(u.id);
      }
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  return ids;
}

async function main() {
  console.log("Resolving creator...");
  const creator = await resolveCreator();
  console.log(`Creator: ${creator.username} (${creator.id})`);

  console.log(`Setting plan = 'business' for ${creator.username}...`);
  const { error: planErr } = await supabase.from("profiles").update({ plan: "business" }).eq("id", creator.id);
  if (planErr) throw new Error(`profiles.plan update failed: ${planErr.message}`);

  const { data: prompts, error: promptsErr } = await supabase
    .from("prompts")
    .select("id, slug")
    .eq("author_id", creator.id);
  if (promptsErr) throw new Error(`prompts lookup failed: ${promptsErr.message}`);
  const slugByPromptId = new Map((prompts ?? []).map((p) => [p.id, p.slug]));

  const demoLeadIds = await getDemoLeadIds();

  const { data: allLeads, error: leadsErr } = await supabase
    .from("lead_alert_state")
    .select("user_id")
    .eq("creator_id", creator.id);
  if (leadsErr) throw new Error(`lead_alert_state lookup failed: ${leadsErr.message}`);

  const leadIds = (allLeads ?? []).map((l) => l.user_id).filter((id) => demoLeadIds.has(id));
  leadIds.sort(); // deterministic bucketing across re-runs

  console.log(`Found ${leadIds.length} demo-seeded lead(s) (of ${allLeads?.length ?? 0} total leads for this creator).`);

  const { data: promptEvents, error: eventsErr } = await supabase
    .from("lead_events")
    .select("user_id, prompt_id")
    .eq("creator_id", creator.id)
    .not("prompt_id", "is", null)
    .in("user_id", leadIds);
  if (eventsErr) throw new Error(`lead_events lookup failed: ${eventsErr.message}`);

  const primaryPromptSlugByLead = new Map<string, string>();
  for (const e of promptEvents ?? []) {
    if (!primaryPromptSlugByLead.has(e.user_id) && e.prompt_id) {
      const slug = slugByPromptId.get(e.prompt_id);
      if (slug) primaryPromptSlugByLead.set(e.user_id, slug);
    }
  }

  let anonymousCount = 0;
  let businessOnlyCount = 0;
  let fullIdentityCount = 0;
  const samples: string[] = [];

  for (let i = 0; i < leadIds.length; i++) {
    const leadId = leadIds[i];
    const bucket = i % 10; // 0,1,2 anonymous (30%) | 3 business-only (10%) | 4-9 full identity (60%)

    if (bucket < 3) {
      anonymousCount += 1;
      const { error } = await supabase
        .from("lead_alert_state")
        .update({ identity_consented: false })
        .eq("creator_id", creator.id)
        .eq("user_id", leadId);
      if (error) throw new Error(`lead_alert_state update failed for ${leadId}: ${error.message}`);
      continue;
    }

    const roleSlug = primaryPromptSlugByLead.get(leadId);
    const pool = (roleSlug && PROMPT_SLUG_ROLE_POOL[roleSlug]) || DEFAULT_ROLE_POOL;
    const jobTitle = pick(pool.titles, i * 7 + 3);
    const companyName = pick(COMPANIES, i * 11 + 5);
    const industry = pick(INDUSTRIES, i * 13 + 2);
    const firstName = pick(FIRST_NAMES, i * 17 + 1);
    const lastName = pick(LAST_NAMES, i * 19 + 4);
    const fullName = `${firstName} ${lastName}`;
    const linkedinUrl = `https://www.linkedin.com/in/${slugify(fullName)}-${(i * 2654435761).toString(16).slice(-4)}`;

    const { error: attrErr } = await supabase.from("user_attributes").upsert(
      {
        user_id: leadId,
        job_title: jobTitle,
        company_name: companyName,
        role_category: pool.roleCategory,
        industry,
        linkedin_url: linkedinUrl,
      },
      { onConflict: "user_id" }
    );
    if (attrErr) throw new Error(`user_attributes upsert failed for ${leadId}: ${attrErr.message}`);

    const isBusinessOnly = bucket === 3;
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ display_name: isBusinessOnly ? null : fullName })
      .eq("id", leadId);
    if (profileErr) throw new Error(`profiles.display_name update failed for ${leadId}: ${profileErr.message}`);

    const { error: alertErr } = await supabase
      .from("lead_alert_state")
      .update({ identity_consented: true })
      .eq("creator_id", creator.id)
      .eq("user_id", leadId);
    if (alertErr) throw new Error(`lead_alert_state update failed for ${leadId}: ${alertErr.message}`);

    if (isBusinessOnly) {
      businessOnlyCount += 1;
      if (samples.length < 6) samples.push(`  [business-only] ${jobTitle} @ ${companyName} (no name)`);
    } else {
      fullIdentityCount += 1;
      if (samples.length < 6) samples.push(`  [full] ${fullName} — ${jobTitle} @ ${companyName}`);
    }
  }

  console.log("\nDone. Summary:");
  console.log(`  Creator plan: business`);
  console.log(`  Demo leads processed: ${leadIds.length}`);
  console.log(`  Anonymous (identity_consented=false): ${anonymousCount}`);
  console.log(`  Business-identity-only (title + company, no name): ${businessOnlyCount}`);
  console.log(`  Full identity (name + title + company + LinkedIn): ${fullIdentityCount}`);
  console.log(
    `  Consent rate: ${Math.round(((businessOnlyCount + fullIdentityCount) / leadIds.length) * 100)}%`
  );
  console.log("  Sample identities:");
  samples.forEach((s) => console.log(s));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
