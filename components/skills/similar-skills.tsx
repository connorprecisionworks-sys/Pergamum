import { createPublicClient } from "@/lib/supabase/server";
import { SkillCard } from "./skill-card";
import type { SkillWithAuthor } from "@/lib/types/database";

interface SimilarSkillsProps {
  skill: SkillWithAuthor;
}

export async function SimilarSkills({ skill }: SimilarSkillsProps) {
  const orParts: string[] = [];
  if (skill.category) orParts.push(`category.eq.${skill.category}`);
  if (skill.tags.length > 0) orParts.push(`tags.ov.{${skill.tags.join(",")}}`);
  if (orParts.length === 0) return null;

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("skills")
    .select(
      `*, profiles:profiles!skills_author_id_fkey(id, username, display_name, avatar_url)`
    )
    .eq("status", "published")
    .neq("id", skill.id)
    .or(orParts.join(","))
    .order("upvotes", { ascending: false })
    .limit(3);

  const similar = (data ?? []) as SkillWithAuthor[];
  if (similar.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
        More like this
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {similar.map((s) => (
          <SkillCard key={s.id} skill={s} compact />
        ))}
      </div>
    </div>
  );
}
