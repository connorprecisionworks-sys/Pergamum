"use server";

import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/lib/types/database";

/**
 * Writes the account-type lane picked at /welcome. Guarded to only ever
 * set it once — a picked lane has no back-door re-pick here; converting
 * later (client -> creator) goes through the dashboard/profile toggle
 * instead, which is a distinct, deliberate action.
 */
export async function chooseAccountType(accountType: AccountType): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (profile?.account_type !== null) return {};

  const { error } = await supabase
    .from("profiles")
    .update({ account_type: accountType })
    .eq("id", user.id);

  if (error) return { error: "Couldn't save that. Try again." };

  return {};
}
