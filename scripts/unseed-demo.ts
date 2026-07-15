/**
 * Demo teardown — undoes everything scripts/seed-demo.ts created:
 *   - every fake lead account (auth.users with email matching
 *     demoseed+%@prmpt-demo.test); cascades remove their profiles,
 *     lead_events, and lead_alert_state rows.
 *   - torbs600's demo-marked content library: prompts/skills/packs
 *     whose slug starts with "demoseed-" (cascades remove their
 *     pack_items, including the ones appended to the real Salifly
 *     pack, without touching that pack itself or its original items).
 *
 * Run with: npx tsx scripts/unseed-demo.ts
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
const DEMO_SLUG_PREFIX = "demoseed-";
const TARGET_USERNAME = "user_20c5de1f";
const TARGET_EMAIL = "torbs600@gmail.com";

function isDemoSeedEmail(email: string | undefined): boolean {
  if (!email) return false;
  return email.startsWith(DEMO_EMAIL_PREFIX) && email.endsWith(`@${DEMO_EMAIL_DOMAIN}`);
}

async function resolveCreatorId(): Promise<string | null> {
  const byUsername = await supabase.from("profiles").select("id").eq("username", TARGET_USERNAME).maybeSingle();
  if (byUsername.data) return byUsername.data.id;

  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed while resolving creator: ${error.message}`);
    const match = data.users.find((u) => u.email === TARGET_EMAIL);
    if (match) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function removeDemoContentLibrary(creatorId: string) {
  const { data: packs, error: packsErr } = await supabase
    .from("packs")
    .delete()
    .eq("creator_id", creatorId)
    .like("slug", `${DEMO_SLUG_PREFIX}%`)
    .select("id");
  if (packsErr) throw new Error(`pack cleanup failed: ${packsErr.message}`);

  const { data: skills, error: skillsErr } = await supabase
    .from("skills")
    .delete()
    .eq("author_id", creatorId)
    .like("slug", `${DEMO_SLUG_PREFIX}%`)
    .select("id");
  if (skillsErr) throw new Error(`skill cleanup failed: ${skillsErr.message}`);

  const { data: prompts, error: promptsErr } = await supabase
    .from("prompts")
    .delete()
    .eq("author_id", creatorId)
    .like("slug", `${DEMO_SLUG_PREFIX}%`)
    .select("id");
  if (promptsErr) throw new Error(`prompt cleanup failed: ${promptsErr.message}`);

  return {
    packsRemoved: packs?.length ?? 0,
    skillsRemoved: skills?.length ?? 0,
    promptsRemoved: prompts?.length ?? 0,
  };
}

async function main() {
  console.log("Scanning auth.users for demo seed accounts...");

  const demoUserIds: string[] = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    for (const u of data.users) {
      if (isDemoSeedEmail(u.email)) demoUserIds.push(u.id);
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  console.log(`Found ${demoUserIds.length} demo seed account(s). Deleting...`);

  let removed = 0;
  let failed = 0;
  for (const id of demoUserIds) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error(`  Failed to delete ${id}: ${error.message}`);
      failed += 1;
      continue;
    }
    removed += 1;
  }

  console.log(`Removed ${removed} demo seed lead account(s).${failed > 0 ? ` ${failed} failed.` : ""}`);

  console.log("\nRemoving demo content library (prompts/skills/packs)...");
  const creatorId = await resolveCreatorId();
  if (!creatorId) {
    console.log(`  Could not resolve creator "${TARGET_USERNAME}" — skipping content library cleanup.`);
    console.log("\nDone.");
    return;
  }

  const contentResult = await removeDemoContentLibrary(creatorId);

  console.log("\nDone. Summary:");
  console.log(`  Lead accounts removed: ${removed}${failed > 0 ? ` (${failed} failed)` : ""}`);
  console.log(`  Packs removed: ${contentResult.packsRemoved}`);
  console.log(`  Skills removed: ${contentResult.skillsRemoved}`);
  console.log(`  Prompts removed: ${contentResult.promptsRemoved}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
