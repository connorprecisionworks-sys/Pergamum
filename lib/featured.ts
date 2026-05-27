import { createPublicClient } from "@/lib/supabase/server";
import type { SkillWithAuthor, PromptWithAuthor } from "@/lib/types/database";

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

type FeaturedResult =
  | { kind: "skill"; skill: SkillWithAuthor }
  | { kind: "prompt"; prompt: PromptWithAuthor }
  | null;

async function fetchTopSkill(
  supabase: ReturnType<typeof createPublicClient>
): Promise<SkillWithAuthor | null> {
  const { data } = await supabase
    .from("skills")
    .select(
      `*, profiles:profiles!skills_author_id_fkey(id, username, display_name, avatar_url)`
    )
    .eq("status", "published")
    .order("trending_score", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as SkillWithAuthor | null;
}

async function fetchTopPrompt(
  supabase: ReturnType<typeof createPublicClient>
): Promise<PromptWithAuthor | null> {
  const { data } = await supabase
    .from("prompts")
    .select(
      `*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
    )
    .eq("status", "published")
    .order("trending_score", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as PromptWithAuthor | null;
}

export async function getFeaturedOfTheDay(): Promise<FeaturedResult> {
  const supabase = createPublicClient();
  const preferSkill = dayOfYear() % 2 === 0;

  if (preferSkill) {
    const skill = await fetchTopSkill(supabase);
    if (skill) return { kind: "skill", skill };
    const prompt = await fetchTopPrompt(supabase);
    if (prompt) return { kind: "prompt", prompt };
    return null;
  } else {
    const prompt = await fetchTopPrompt(supabase);
    if (prompt) return { kind: "prompt", prompt };
    const skill = await fetchTopSkill(supabase);
    if (skill) return { kind: "skill", skill };
    return null;
  }
}
