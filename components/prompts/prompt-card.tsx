import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MODEL_DISPLAY, formatCount, relativeTime, categoryColor } from "@/lib/utils";
import type { PromptWithAuthor } from "@/lib/types/database";

interface PromptCardProps {
  prompt: PromptWithAuthor;
  blurred?: boolean;
  className?: string;
}

export function PromptCard({ prompt, blurred = false, className }: PromptCardProps) {
  const author = prompt.profiles;
  const category = prompt.categories;
  const accentColor = categoryColor(category?.slug ?? null);

  const initials = author?.display_name
    ? author.display_name.slice(0, 2).toUpperCase()
    : author?.username?.slice(0, 2).toUpperCase() ?? "??";

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
            {category && (
              <Link
                href={blurred ? "/auth/signup" : `/prompts?category=${category.slug}`}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted hover:text-foreground transition-colors truncate"
              >
                {category.name}
              </Link>
            )}
          </div>
          <span className="font-mono text-[11px] text-brand-400 shrink-0 ml-2">
            ↑ {formatCount(prompt.upvotes)}
          </span>
        </div>

        {/* Title */}
        {blurred ? (
          <h3 className="font-serif text-[22px] font-medium leading-[1.18] tracking-h3 line-clamp-2 mb-2">
            {prompt.title}
          </h3>
        ) : (
          <Link href={`/prompts/${prompt.slug}`}>
            <h3 className="font-serif text-[22px] font-medium leading-[1.18] tracking-h3 group-hover:text-brand-400 transition-colors line-clamp-2 mb-2">
              {prompt.title}
            </h3>
          </Link>
        )}

        {/* Description */}
        {prompt.description && (
          <p
            className={`text-[14px] text-foreground-muted line-clamp-2 leading-[1.55] transition-[filter] ${
              blurred ? "blur-[3px] select-none pointer-events-none" : ""
            }`}
          >
            {prompt.description}
          </p>
        )}

        {/* Model badges — outline pills, no fill */}
        {prompt.model_tags.length > 0 && (
          <div
            className={`flex gap-1.5 mt-3 flex-wrap transition-[filter] ${
              blurred ? "blur-[3px] select-none pointer-events-none" : ""
            }`}
          >
            {prompt.model_tags.slice(0, 3).map((m) => (
              <span
                key={m}
                className="font-mono text-[11px] border border-border rounded-full px-2 py-0.5 text-foreground-muted"
              >
                {MODEL_DISPLAY[m]?.label ?? m}
              </span>
            ))}
          </div>
        )}

        {/* Tags — inline mono dot-separated */}
        {prompt.tags.length > 0 && (
          <p
            className={`mt-2 font-mono text-[11px] text-foreground-muted leading-relaxed transition-[filter] ${
              blurred ? "blur-[3px] select-none pointer-events-none" : ""
            }`}
          >
            {prompt.tags.slice(0, 4).map((tag, i) => (
              <span key={tag}>
                {i > 0 && <span className="mx-1 opacity-40">·</span>}
                <Link
                  href={`/prompts?tag=${encodeURIComponent(tag)}`}
                  className="hover:text-foreground transition-colors"
                  tabIndex={blurred ? -1 : undefined}
                >
                  #{tag}
                </Link>
              </span>
            ))}
          </p>
        )}

        {/* Sign-up nudge */}
        {blurred && (
          <div className="mt-3 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-brand-400 shrink-0" />
            <Link
              href="/auth/signup"
              className="label-mono text-brand-500 hover:text-brand-400 transition-colors"
            >
              Free to read — sign up
            </Link>
          </div>
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
            href={blurred ? "/auth/signup" : `/u/${author?.username}`}
            className="label-mono hover:text-foreground-muted transition-colors truncate"
          >
            {author?.display_name ?? author?.username}
          </Link>
          <span className="label-mono opacity-40">·</span>
          <span className="label-mono whitespace-nowrap">
            {relativeTime(prompt.published_at ?? prompt.created_at)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
