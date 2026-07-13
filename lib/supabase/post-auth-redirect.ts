import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Where to send a user right after a client-side auth call establishes a
 * session. Mirrors the onboarding gate in app/auth/callback/route.ts — that
 * route only runs for OAuth (and email-confirmation) redirects, so password
 * sign-in/sign-up/reset, which set the session directly in the browser, need
 * the same "finish onboarding first" check applied here instead.
 */
export async function postAuthDestination(
  supabase: SupabaseClient<Database>,
  returnTo?: string
): Promise<string> {
  const next = returnTo ?? "/dashboard";
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profile && !profile.onboarding_complete) {
      const safeNext = next.startsWith("/") && !next.startsWith("//");
      return safeNext ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding";
    }
  }

  return next;
}
