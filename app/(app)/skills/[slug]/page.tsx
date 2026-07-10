import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Tag } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InstallCommandBlock } from "@/components/skills/install-command-block";
import { SkillVoteButtons } from "@/components/skills/skill-vote-buttons";
import { SkillReportButton } from "@/components/skills/skill-report-button";
import { SimilarSkills } from "@/components/skills/similar-skills";
import { relativeTime, formatCount, categoryColor } from "@/lib/utils";
import type { SkillWithAuthor, VoteValue } from "@/lib/types/database";

interface SkillPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SkillPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: skill } = await supabase
    .from("skills")
    .select("name, summary")
    .eq("slug", slug)
    .single();

  if (!skill) return { title: "Skill not found" };

  return {
    title: skill.name,
    description: skill.summary,
  };
}

export default async function SkillDetailPage({ params }: SkillPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: skill } = await supabase
    .from("skills")
    .select(
      `*, profiles:profiles!skills_author_id_fkey(id, username, display_name, avatar_url)`
    )
    .eq("slug", slug)
    .single();

  if (!skill || (skill.status !== "published" && skill.author_id !== user?.id)) {
    notFound();
  }

  // Fire-and-forget view increment. Service-role bypasses RLS so anonymous
  // visitors are counted. Wrapped in try/catch so a tracking failure never
  // breaks page rendering.
  if (skill.status === "published") {
    try {
      const adminSb = await createServiceClient();
      void adminSb
        .from("skills")
        .update({ views: (skill.views ?? 0) + 1 })
        .eq("id", skill.id)
        .then(() => {});
    } catch {
      // Silent — view tracking is best-effort.
    }
  }

  let currentVote: VoteValue | null = null;
  if (user) {
    const { data } = await supabase
      .from("skill_votes")
      .select("value")
      .eq("user_id", user.id)
      .eq("skill_id", skill.id)
      .single();
    if (data) currentVote = data.value as VoteValue;
  }

  const typed = skill as SkillWithAuthor;
  const author = typed.profiles;
  const accentColor = categoryColor(typed.category);

  const initials = author?.display_name
    ? author.display_name.slice(0, 2).toUpperCase()
    : author?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="container py-8">
      <Link
        href="/skills"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to skills
      </Link>

      <article className="max-w-3xl mx-auto space-y-8">
        {/* Hero image / loop */}
        {typed.hero_image_url && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
            {typed.hero_loop_url ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                poster={typed.hero_poster_url ?? typed.hero_image_url}
                className="w-full h-full object-cover"
              >
                <source src={typed.hero_loop_url} />
              </video>
            ) : (
              <img
                src={typed.hero_image_url}
                alt={typed.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Hero header — same radial-gradient treatment as browse pages */}
        <div className="rounded-lg px-6 py-7 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)] space-y-4">
          {/* Category dot + label | runtime badges */}
          <div className="flex flex-wrap items-center gap-2">
            {typed.category && (
              <Link
                href={`/skills?category=${encodeURIComponent(typed.category)}`}
                className="flex items-center gap-2 group/cat"
              >
                <span
                  className="inline-block w-[7px] h-[7px] rounded-full shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted group-hover/cat:text-foreground transition-colors capitalize">
                  {typed.category}
                </span>
              </Link>
            )}
            {typed.runtimes.map((rt) => (
              <span
                key={rt}
                className="font-mono text-[11px] border border-border rounded-full px-2 py-0.5 text-foreground-muted"
              >
                {rt}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-medium tracking-tight">{typed.name}</h1>

          <p className="text-muted-foreground text-lg leading-relaxed">
            {typed.summary}
          </p>

          {/* Author + meta — label-mono treatment matching card footer */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage
                  src={author?.avatar_url ?? undefined}
                  alt={author?.display_name ?? author?.username ?? ""}
                />
                <AvatarFallback className="text-xs bg-brand-100 text-brand-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/u/${author?.username}`}
                className="text-sm font-medium hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              >
                {author?.display_name ?? author?.username}
              </Link>
              <span className="label-mono opacity-40">·</span>
              <span className="label-mono">
                {relativeTime(typed.published_at ?? typed.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="label-mono">{formatCount(typed.copies)} installs</span>
              <span className="label-mono opacity-40">·</span>
              <span className="label-mono">{formatCount(typed.views)} views</span>
            </div>
          </div>

          {/* Tags */}
          {typed.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {typed.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/skills?tag=${encodeURIComponent(tag)}`}
                  className="text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2 py-0.5 rounded transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Install command — headline action */}
        {typed.install_command && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                Install
              </h2>
              <SkillVoteButtons
                skillId={typed.id}
                initialUpvotes={typed.upvotes}
                initialDownvotes={typed.downvotes}
                currentVote={currentVote}
              />
            </div>
            <InstallCommandBlock skillId={typed.id} command={typed.install_command} />
            <p className="text-xs text-muted-foreground">
              Paste this into Claude Code (or your terminal) to install. Always
              skim the source before running CLI commands from strangers.
            </p>
          </div>
        )}

        {/* External source link */}
        {typed.source_url && (
          <div className="rounded-md border border-border bg-background-subtle/40 p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-1">
                Source
              </div>
              <a
                href={typed.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-400 break-all"
              >
                {typed.source_url}
              </a>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={typed.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open
              </a>
            </Button>
          </div>
        )}

        {/* SKILL.md preview — same container language as install chip */}
        {typed.readme && (
          <div className="space-y-3">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
              SKILL.md
            </h2>
            <div className="bg-background-inset border border-border rounded-md overflow-hidden">
              <pre className="p-5 md:p-6 text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                {typed.readme}
              </pre>
            </div>
          </div>
        )}

        {/* Similar skills */}
        <SimilarSkills skill={typed} />

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/skills/submit">Share your own</Link>
          </Button>
          <SkillReportButton skillId={typed.id} currentUserId={user?.id ?? null} />
        </div>
      </article>
    </div>
  );
}
