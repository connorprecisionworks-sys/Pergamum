"use client";

import Link from "next/link";
import { ArrowUp, Eye, Lock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModelBadge } from "./model-badge";
import { formatCount, relativeTime } from "@/lib/utils";
import type { PromptWithAuthor } from "@/lib/types/database";

interface PromptCardProps {
  prompt: PromptWithAuthor;
  blurred?: boolean;
  className?: string;
}

export function PromptCard({ prompt, blurred = false, className }: PromptCardProps) {
  const author = prompt.profiles;
  const category = prompt.categories;

  const initials = author?.display_name
    ? author.display_name.slice(0, 2).toUpperCase()
    : author?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <Card
      className={`group card-hover border-border bg-card animate-fade-in ${className ?? ""}`}
    >
      <CardContent className="p-5 pb-3">
        {/* Category + models */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {category && (
            <Link
              href={blurred ? "/auth/signup" : `/prompts?category=${category.slug}`}
              className="label-mono text-pergamum-500 hover:text-pergamum-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {category.name}
            </Link>
          )}
          {prompt.model_tags.slice(0, 3).map((m) => (
            <ModelBadge key={m} model={m} />
          ))}
        </div>

        {/* Title — Fraunces */}
        {blurred ? (
          <h3 className="font-serif text-[17px] font-medium leading-snug tracking-h3 line-clamp-2 mb-2">
            {prompt.title}
          </h3>
        ) : (
          <Link href={`/prompts/${prompt.slug}`}>
            <h3 className="font-serif text-[17px] font-medium leading-snug tracking-h3 group-hover:text-pergamum-400 transition-colors line-clamp-2 mb-2">
              {prompt.title}
            </h3>
          </Link>
        )}

        {/* Description */}
        {prompt.description && (
          <p
            className={`text-[13px] text-foreground-muted line-clamp-2 leading-relaxed transition-[filter] ${
              blurred ? "blur-[3px] select-none pointer-events-none" : ""
            }`}
          >
            {prompt.description}
          </p>
        )}

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div
            className={`flex gap-1.5 mt-3 flex-wrap transition-[filter] ${
              blurred ? "blur-[3px] select-none pointer-events-none" : ""
            }`}
          >
            {prompt.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/prompts?tag=${encodeURIComponent(tag)}`}
                className="label-mono px-2 py-0.5 rounded bg-background-subtle hover:bg-background-inset hover:text-foreground-muted transition-colors"
                onClick={(e) => e.stopPropagation()}
                tabIndex={blurred ? -1 : undefined}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Sign-up nudge */}
        {blurred && (
          <div className="mt-3 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-pergamum-400 shrink-0" />
            <Link
              href="/auth/signup"
              className="label-mono text-pergamum-500 hover:text-pergamum-400 transition-colors"
            >
              Free to read — sign up
            </Link>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-border flex items-center justify-between">
        {/* Author + time */}
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
            href={blurred ? "/auth/signup" : `/u/${author?.username}`}
            className="label-mono hover:text-foreground-muted transition-colors truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {author?.display_name ?? author?.username}
          </Link>
          <span className="label-mono opacity-40">·</span>
          <span className="label-mono whitespace-nowrap">
            {relativeTime(prompt.published_at ?? prompt.created_at)}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3 text-foreground-subtle" />
            <span className="label-mono">{formatCount(prompt.upvotes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-foreground-subtle" />
            <span className="label-mono">{formatCount(prompt.views)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
