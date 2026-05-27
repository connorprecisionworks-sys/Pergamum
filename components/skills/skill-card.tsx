import Link from "next/link";
import { ArrowUp, Eye, ExternalLink, Terminal } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCount, relativeTime } from "@/lib/utils";
import type { SkillWithAuthor } from "@/lib/types/database";

interface SkillCardProps {
  skill: SkillWithAuthor;
  className?: string;
}

export function SkillCard({ skill, className }: SkillCardProps) {
  const author = skill.profiles;
  const initials = author?.display_name
    ? author.display_name.slice(0, 2).toUpperCase()
    : author?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <Card
      className={`group card-hover border-border bg-card animate-fade-in ${className ?? ""}`}
    >
      <CardContent className="p-5 pb-3">
        {/* Category + runtime row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {skill.category && (
            <Link
              href={`/skills?category=${encodeURIComponent(skill.category)}`}
              className="label-mono text-pergamum-500 hover:text-pergamum-400 transition-colors capitalize"
            >
              {skill.category}
            </Link>
          )}
          {skill.runtimes.slice(0, 3).map((rt) => (
            <span
              key={rt}
              className="label-mono px-2 py-0.5 rounded bg-background-subtle text-foreground-muted"
            >
              {rt}
            </span>
          ))}
        </div>

        {/* Name */}
        <Link href={`/skills/${skill.slug}`}>
          <h3 className="font-serif text-[17px] font-medium leading-snug tracking-h3 group-hover:text-pergamum-400 transition-colors line-clamp-2 mb-2">
            {skill.name}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-[13px] text-foreground-muted line-clamp-2 leading-relaxed">
          {skill.summary}
        </p>

        {/* Quick-glance install signal */}
        <div className="flex items-center gap-3 mt-3 text-foreground-subtle">
          {skill.install_command && (
            <div className="flex items-center gap-1 label-mono">
              <Terminal className="h-3 w-3" />
              <span>CLI</span>
            </div>
          )}
          {skill.source_url && (
            <div className="flex items-center gap-1 label-mono">
              <ExternalLink className="h-3 w-3" />
              <span>Source</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {skill.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {skill.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/skills?tag=${encodeURIComponent(tag)}`}
                className="label-mono px-2 py-0.5 rounded bg-background-subtle hover:bg-background-inset hover:text-foreground-muted transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage
              src={author?.avatar_url ?? undefined}
              alt={author?.display_name ?? author?.username ?? ""}
            />
            <AvatarFallback className="text-[9px] bg-background-subtle text-foreground-muted">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/u/${author?.username}`}
            className="label-mono hover:text-foreground-muted transition-colors truncate"
          >
            {author?.display_name ?? author?.username}
          </Link>
          <span className="label-mono opacity-40">·</span>
          <span className="label-mono whitespace-nowrap">
            {relativeTime(skill.published_at ?? skill.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3 text-foreground-subtle" />
            <span className="label-mono">{formatCount(skill.upvotes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-foreground-subtle" />
            <span className="label-mono">{formatCount(skill.views)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
