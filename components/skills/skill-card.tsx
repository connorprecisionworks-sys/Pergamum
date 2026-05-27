"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCount, relativeTime, categoryColor } from "@/lib/utils";
import type { SkillWithAuthor } from "@/lib/types/database";

interface SkillCardProps {
  skill: SkillWithAuthor;
  className?: string;
}

export function SkillCard({ skill, className }: SkillCardProps) {
  const [copied, setCopied] = useState(false);
  const author = skill.profiles;
  const accentColor = categoryColor(skill.category);

  const initials = author?.display_name
    ? author.display_name.slice(0, 2).toUpperCase()
    : author?.username?.slice(0, 2).toUpperCase() ?? "??";

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!skill.install_command) return;

    navigator.clipboard
      .writeText(skill.install_command)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
        toast.success("Install command copied to clipboard.");
        fetch("/api/skills/copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skillId: skill.id }),
        }).catch(() => {});
      })
      .catch(() => {
        toast.error("Couldn't copy. Try selecting the text manually.");
      });
  };

  return (
    <Card
      className={`group card-hover border-border bg-card animate-fade-in rounded-r-md rounded-l-none shadow-none ${className ?? ""}`}
      style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
    >
      <CardContent className="p-5 pb-3">
        {/* Top row: dot + category label | upvote count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block w-[7px] h-[7px] rounded-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            {skill.category && (
              <Link
                href={`/skills?category=${encodeURIComponent(skill.category)}`}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted hover:text-foreground transition-colors truncate capitalize"
              >
                {skill.category}
              </Link>
            )}
          </div>
          <span className="font-mono text-[11px] text-pergamum-400 shrink-0 ml-2">
            ↑ {formatCount(skill.upvotes)}
          </span>
        </div>

        {/* Name */}
        <Link href={`/skills/${skill.slug}`}>
          <h3 className="font-serif text-[22px] font-medium leading-[1.18] tracking-h3 group-hover:text-pergamum-400 transition-colors line-clamp-2 mb-2">
            {skill.name}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-[14px] text-foreground-muted line-clamp-2 leading-[1.55]">
          {skill.summary}
        </p>

        {/* Inline install command chip */}
        {skill.install_command && (
          <div className="flex items-center gap-2 mt-3 bg-background-inset border border-border rounded-md px-2.5 py-1.5">
            <span className="font-mono text-[12px] text-foreground flex-1 truncate">
              {skill.install_command}
            </span>
            <button
              onClick={handleCopy}
              aria-label="Copy install command"
              className="font-mono text-[11px] text-foreground-muted hover:text-foreground bg-transparent border border-border rounded px-2 py-0.5 transition-colors shrink-0"
            >
              {copied ? (
                <span className="text-pergamum-400">✓ copied</span>
              ) : (
                "copy"
              )}
            </button>
          </div>
        )}

        {/* Runtime badges — outline pills, no fill */}
        {skill.runtimes.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {skill.runtimes.slice(0, 3).map((rt) => (
              <span
                key={rt}
                className="font-mono text-[11px] border border-border rounded-full px-2 py-0.5 text-foreground-muted"
              >
                {rt}
              </span>
            ))}
          </div>
        )}

        {/* Tags — inline mono dot-separated */}
        {skill.tags.length > 0 && (
          <p className="mt-2 font-mono text-[11px] text-foreground-muted leading-relaxed">
            {skill.tags.slice(0, 4).map((tag, i) => (
              <span key={tag}>
                {i > 0 && <span className="mx-1 opacity-40">·</span>}
                <Link
                  href={`/skills?tag=${encodeURIComponent(tag)}`}
                  className="hover:text-foreground transition-colors"
                >
                  #{tag}
                </Link>
              </span>
            ))}
          </p>
        )}
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-border flex items-center">
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
      </CardFooter>
    </Card>
  );
}
