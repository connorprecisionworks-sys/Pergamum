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
      className={`group hover:border-pergamum-200 dark:hover:border-pergamum-800 hover:shadow-sm transition-all animate-fade-in ${className ?? ""}`}
    >
      <CardContent className="p-5 pb-3">
        {/* Category + models — always visible */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {category && (
            <Link
              href={blurred ? "/auth/signup" : `/prompts?category=${category.slug}`}
              className="text-xs font-medium text-pergamum-600 hover:text-pergamum-700 dark:text-pergamum-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {category.name}
            </Link>
          )}
          {prompt.model_tags.slice(0, 3).map((m) => (
            <ModelBadge key={m} model={m} />
          ))}
        </div>

        {/* Title — always visible */}
        {blurred ? (
          <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2">
            {prompt.title}
          </h3>
        ) : (
          <Link href={`/prompts/${prompt.slug}`}>
            <h3 className="font-semibold text-base leading-snug group-hover:text-pergamum-700 dark:group-hover:text-pergamum-400 transition-colors line-clamp-2 mb-2">
              {prompt.title}
            </h3>
          </Link>
        )}

        {/* Description — blurred when locked */}
        {prompt.description && (
          <p
            className={`text-sm text-muted-foreground line-clamp-2 leading-relaxed transition-[filter] ${
              blurred ? "blur-[3px] select-none pointer-events-none" : ""
            }`}
          >
            {prompt.description}
          </p>
        )}

        {/* Tags — blurred when locked */}
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
                className="text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2 py-0.5 rounded transition-colors"
                onClick={(e) => e.stopPropagation()}
                tabIndex={blurred ? -1 : undefined}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Sign-up nudge — only when blurred */}
        {blurred && (
          <div className="mt-3 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-pergamum-400 shrink-0" />
            <Link
              href="/auth/signup"
              className="text-xs text-pergamum-600 hover:text-pergamum-700 font-medium transition-colors"
            >
              Free to read — sign up
            </Link>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 py-3 border-t flex items-center justify-between">
        {/* Author — always visible */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={author?.avatar_url ?? undefined}
              alt={author?.display_name ?? author?.username ?? ""}
            />
            <AvatarFallback className="text-[10px] bg-pergamum-100 text-pergamum-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Link
            href={blurred ? "/auth/signup" : `/u/${author?.username}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {author?.display_name ?? author?.username}
          </Link>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {relativeTime(prompt.published_at ?? prompt.created_at)}
          </span>
        </div>

        {/* Stats — always visible (social proof) */}
        <div className="flex items-center gap-3 text-muted-foreground shrink-0">
          <div className="flex items-center gap-1 text-xs">
            <ArrowUp className="h-3.5 w-3.5" />
            <span>{formatCount(prompt.upvotes)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Eye className="h-3.5 w-3.5" />
            <span>{formatCount(prompt.views)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
