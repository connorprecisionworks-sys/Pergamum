"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCount, relativeTime, categoryColor } from "@/lib/utils";
import type { SkillWithAuthor } from "@/lib/types/database";
import { getTheme } from "./themes/registry";

interface SkillCardProps {
  skill: SkillWithAuthor;
  className?: string;
  compact?: boolean;
}

export function SkillCard({ skill, className, compact = false }: SkillCardProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
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
        if (!compact) {
          setTimeout(() => router.push(`/skills/${skill.slug}`), 250);
        }
      })
      .catch(() => {
        toast.error("Couldn't copy. Try selecting the text manually.");
      });
  };

  const hasHero = !!skill.hero_image_url;
  const hasLoop = !!skill.hero_loop_url;

  // Themed featured cards take over the render entirely (full mode only —
  // compact mode in similar-skills falls back to the default card).
  const ThemeComponent = !compact && skill.is_featured ? getTheme(skill.theme_id) : null;
  if (ThemeComponent) {
    return <ThemeComponent skill={skill} mode="card" />;
  }

  // Compact mode: legacy card layout (no hero, left border on card itself)
  if (compact) {
    return (
      <Card
        className={`group card-hover border-border bg-card animate-fade-in rounded-r-md rounded-l-none shadow-none ${className ?? ""}`}
        style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
      >
        <CardContent className="p-5 pb-3">
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
            <span className="font-mono text-[11px] text-foreground-subtle shrink-0 ml-2">
              ⤓ {formatCount(skill.copies)}
            </span>
          </div>

          <Link href={`/skills/${skill.slug}`}>
            <h3 className="font-serif text-[22px] font-medium leading-[1.18] tracking-h3 group-hover:text-brand-400 transition-colors line-clamp-2 mb-2">
              {skill.name}
            </h3>
          </Link>

          <p className="text-[14px] text-foreground-muted line-clamp-2 leading-[1.55]">
            {skill.summary}
          </p>

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
                {copied ? <span className="text-brand-400">✓ copied</span> : "copy"}
              </button>
            </div>
          )}

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

  // Full (non-compact) mode: hero image/video or designed fallback tile
  return (
    <Card
      className={`group card-hover border-border bg-card animate-fade-in rounded-md shadow-none overflow-hidden ${className ?? ""}`}
      style={{ borderLeftWidth: 0 }}
    >
      {/* Hero area — 16:9, always rendered in full mode */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {hasLoop ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={skill.hero_poster_url ?? skill.hero_image_url ?? undefined}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          >
            <source src={skill.hero_loop_url!} />
          </video>
        ) : hasHero ? (
          <img
            src={skill.hero_image_url!}
            alt={skill.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          // Designed fallback — looks intentional, not broken
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{ background: "#0f0f12" }} />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: accentColor, opacity: 0.07 }}
            />
            <div className="absolute inset-0 flex items-center justify-center px-8">
              <span className="font-serif text-3xl text-white/20 text-center line-clamp-2 leading-tight select-none">
                {skill.name}
              </span>
            </div>
          </div>
        )}

        {/* Install chip — glassy overlay anchored to hero bottom */}
        {skill.install_command && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-md px-2.5 py-1.5">
            <span className="font-mono text-[12px] text-white/90 flex-1 truncate">
              {skill.install_command}
            </span>
            <button
              onClick={handleCopy}
              aria-label="Copy install command"
              className="font-mono text-[11px] text-white/60 hover:text-white bg-transparent border border-white/20 rounded px-2 py-0.5 transition-colors shrink-0"
            >
              {copied ? <span className="text-emerald-400">✓</span> : "copy"}
            </button>
          </div>
        )}
      </div>

      {/* Content + footer — accent border only on this section */}
      <div style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}>
        <CardContent className="p-5 pb-3">
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
            <span className="font-mono text-[11px] text-foreground-subtle shrink-0 ml-2">
              ⤓ {formatCount(skill.copies)}
            </span>
          </div>

          <Link href={`/skills/${skill.slug}`}>
            <h3 className="font-serif text-[22px] font-medium leading-[1.18] tracking-h3 group-hover:text-brand-400 transition-colors line-clamp-2 mb-2">
              {skill.name}
            </h3>
          </Link>

          <p className="text-[14px] text-foreground-muted line-clamp-2 leading-[1.55]">
            {skill.summary}
          </p>

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
      </div>
    </Card>
  );
}
