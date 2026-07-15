/**
 * Demo teardown — deletes every fake lead account created by
 * scripts/seed-demo.ts (auth.users with email matching
 * demoseed+%@prmpt-demo.test). Cascades remove their profiles,
 * lead_events, and lead_alert_state rows.
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

function isDemoSeedEmail(email: string | undefined): boolean {
  if (!email) return false;
  return email.startsWith(DEMO_EMAIL_PREFIX) && email.endsWith(`@${DEMO_EMAIL_DOMAIN}`);
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

  console.log(`\nDone. Removed ${removed} demo seed account(s).${failed > 0 ? ` ${failed} failed.` : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
