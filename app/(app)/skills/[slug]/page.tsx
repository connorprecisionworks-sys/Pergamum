import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InstallCommandBlock } from "@/components/skills/install-command-block";
import { SkillVoteButtons } from "@/components/skills/skill-vote-buttons";
import { SkillReportButton } from "@/components/skills/skill-report-button";
import { relativeTime, formatCount } from "@/lib/utils";
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

  // Fetch current user's vote on this skill
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
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {typed.category && (
              <Link
                href={`/skills?category=${encodeURIComponent(typed.category)}`}
                className="text-sm font-medium text-pergamum-600 hover:text-pergamum-700 capitalize"
              >
                {typed.category}
              </Link>
            )}
            {typed.runtimes.map((rt) => (
              <span
                key={rt}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {rt}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{typed.name}</h1>

          <p className="text-muted-foreground text-lg leading-relaxed">
            {typed.summary}
          </p>

          {/* Author + meta */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={author?.avatar_url ?? undefined}
                  alt={author?.display_name ?? author?.username ?? ""}
                />
                <AvatarFallback className="text-xs bg-pergamum-100 text-pergamum-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <Link
                  href={`/u/${author?.username}`}
                  className="font-medium hover:text-pergamum-600 transition-colors"
                >
                  {author?.display_name ?? author?.username}
                </Link>
                <span className="text-muted-foreground ml-2">
                  {relativeTime(typed.published_at ?? typed.created_at)}
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {formatCount(typed.copies)} install copies
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

        {/* Install command — the headline action on this page */}
        {typed.install_command && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
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
          <div className="rounded-lg border border-border bg-background-subtle/40 p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Source
              </div>
              <a
                href={typed.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-pergamum-600 hover:text-pergamum-700 break-all"
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

        {/* Inline SKILL.md preview */}
        {typed.readme && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              SKILL.md
            </h2>
            <div className="rounded-xl border bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
              <pre className="p-4 md:p-6 text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                {typed.readme}
              </pre>
            </div>
          </div>
        )}

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
