import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Where to send a user right after a client-side auth call establishes a
 * session. Mirrors the onboarding gate in app/(app)/layout.tsx — that gate
 * only runs once a user is already navigating inside (app), so this covers
 * the moment auth itself completes (password sign-in/sign-up/reset, which
 * set the session directly in the browser) with the same three-lane check,
 * or a brand-new landing signup would skip /welcome entirely and land
 * straight in the client flow before ever picking a lane.
 */
export async function postAuthDestination(
  supabase: SupabaseClient<Database>,
  returnTo?: string
): Promise<string> {
  const next = returnTo ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//");
  const withNext = (path: string) => (safeNext ? `${path}?next=${encodeURIComponent(next)}` : path);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type, creator_onboarding_complete, onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profile) {
      if (profile.account_type === null) return withNext("/welcome");
      if (profile.account_type === "creator" && !profile.creator_onboarding_complete) {
        return withNext("/creator/onboarding");
      }
      if (profile.account_type === "client" && !profile.onboarding_complete) {
        return withNext("/onboarding");
      }
    }
  }

  return next;
}
