import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasBuildAccess } from "@/lib/build-access";
import { PackBuilder } from "@/components/packs/builder/pack-builder";
import type { PackItemWithContent, PromptWithAuthor, SkillWithAuthor } from "@/lib/types/database";

export const metadata: Metadata = { title: "Pack builder" };

interface PackBuilderPageProps {
  params: Promise<{ id: string }>;
}

export default async function PackBuilderPage({ params }: PackBuilderPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/dashboard/packs/${id}`);

  const { data: pack } = await supabase.from("packs").select("*").eq("id", id).single();
  if (!pack || pack.creator_id !== user.id) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("id", user.id)
    .single();
  if (!profile) notFound();

  const { data: itemRows } = await supabase
    .from("pack_items")
    .select(
      `*,
      prompts:prompts(*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)),
      skills:skills(*, profiles:profiles!skills_author_id_fkey(id, username, display_name, avatar_url))`
    )
    .eq("pack_id", pack.id)
    .order("position");
  const items = (itemRows ?? []) as unknown as PackItemWithContent[];

  const { data: versions } = await supabase
    .from("pack_versions")
    .select("*")
    .eq("pack_id", pack.id)
    .order("version", { ascending: false });

  const inPackPromptIds = items.filter((i) => i.item_type === "prompt").map((i) => i.prompt_id!);
  const inPackSkillIds = items.filter((i) => i.item_type === "skill").map((i) => i.skill_id!);

  let promptsQuery = supabase
    .from("prompts")
    .select(
      `*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
    )
    .eq("author_id", user.id)
    .eq("status", "published");
  if (inPackPromptIds.length > 0) promptsQuery = promptsQuery.not("id", "in", `(${inPackPromptIds.join(",")})`);

  let skillsQuery = supabase
    .from("skills")
    .select(`*, profiles:profiles!skills_author_id_fkey(id, username, display_name, avatar_url)`)
    .eq("author_id", user.id)
    .eq("status", "published");
  if (inPackSkillIds.length > 0) skillsQuery = skillsQuery.not("id", "in", `(${inPackSkillIds.join(",")})`);

  const [{ data: prompts }, { data: skills }, buildAccessOk] = await Promise.all([
    promptsQuery,
    skillsQuery,
    hasBuildAccess(),
  ]);

  return (
    <PackBuilder
      initialPack={pack}
      initialItems={items}
      initialVersions={versions ?? []}
      creatorProfile={profile}
      libraryPrompts={(prompts as unknown as PromptWithAuthor[]) ?? []}
      librarySkills={(skills as unknown as SkillWithAuthor[]) ?? []}
      buildAccessOk={buildAccessOk}
    />
  );
}
