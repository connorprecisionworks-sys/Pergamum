import Link from "next/link";
import { ArrowUp, Eye, MessageSquare } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModelBadge } from "./model-badge";
import { formatCount, relativeTime } from "@/lib/utils";
import type { PromptWithAuthor } from "@/lib/types/database";

interface PromptCardProps {
  prompt: PromptWithAuthor;
  className?: string;
}

export function PromptCard({ prompt, className }: PromptCardProps) {
  const author = prompt.profiles;
  const category = prompt.categories;

  const initials = author?.display_name
    ? author.display_name.slice(0, 2).toUpperCase()
    : author?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <Card
      className={`group hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-sm transition-all animate-fade-in ${className ?? ""}`}
    >
      <CardContent className="p-5 pb-3">
        {/* Category + models */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {category && (
            <Link
              href={`/prompts?category=${category.slug}`}
              className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {category.name}
            </Link>
          )}
          {prompt.model_tags.slice(0, 3).map((m) => (
            <ModelBadge key={m} model={m} />
          ))}
        </div>

        {/* Title */}
        <Link href={`/prompts/${prompt.slug}`}>
          <h3 className="font-semibold text-base leading-snug group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors line-clamp-2 mb-2">
            {prompt.title}
          </h3>
        </Link>

        {/* Description */}
        {prompt.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {prompt.description}
          </p>
        )}

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {prompt.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/prompts?tag=${encodeURIComponent(tag)}`}
                className="text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2 py-0.5 rounded transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 py-3 border-t flex items-center justify-between">
        {/* Author */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={author?.avatar_url ?? undefined}
              alt={author?.display_name ?? author?.username ?? ""}
            />
            <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/u/${author?.username}`}
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

        {/* Stats */}
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
