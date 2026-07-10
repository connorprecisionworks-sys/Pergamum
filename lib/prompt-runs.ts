import { createClient } from "@/lib/supabase/client";

/**
 * Fire-and-forget log of a prompt fill-in — one row per Copy or AI-launcher
 * click, powering the "Recent" list. Never awaited by callers; a failed
 * insert (RLS, network) shouldn't affect the copy/launch it rode along with.
 */
export function logPromptRun(
  promptId: string,
  userId: string,
  values: Record<string, string>
): void {
  const supabase = createClient();
  supabase
    .from("prompt_runs")
    .insert({ user_id: userId, prompt_id: promptId, values })
    .then(
      () => {},
      () => {}
    );
}
