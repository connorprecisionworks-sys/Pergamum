import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PromptWithAuthor } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface FeaturedPromptsProps {
  prompts: PromptWithAuthor[];
  totalCount: number;
}

/**
 * Horizontal scroll-snap row of featured prompts.
 *
 * No auto-advance, no arrows, no dot indicators. The user scrolls, and the
 * browser snaps to one prompt at a time. Works on mouse-wheel, trackpad,
 * keyboard, and touch — same as any horizontal scroll.
 *
 * Each slot is rendered as editorial typography (no card chrome) to avoid the
 * "grid of identical tiles" look that reads as vibecoded.
 */
export function FeaturedPrompts({ prompts, totalCount }: FeaturedPromptsProps) {
  if (prompts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-2xl md:text-3xl text-foreground/80 max-w-md mx-auto leading-snug">
          The shelves are getting filled.
        </p>
        <p className="text-muted-foreground mt-3 text-sm">
          Be the first to contribute a prompt.
        </p>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
        >
          Submit a prompt
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-6 md:-mx-0">
      {/* Scroll-snap rail */}
      <div
        className={cn(
          "flex gap-6 md:gap-10 overflow-x-auto",
          "snap-x snap-mandatory scroll-px-6 md:scroll-px-12",
          "px-6 md:px-12 pb-6",
          // Hide scrollbar — keep the editorial feel
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {prompts.map((p) => (
          <FeaturedSlot key={p.id} prompt={p} />
        ))}
        {/* Trailing "see all" tile — same width, restrained, no card chrome */}
        <Link
          href="/prompts"
          className="snap-start shrink-0 w-[85vw] md:w-[640px] flex flex-col justify-center items-start py-12 group"
        >
          <span className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground">
            And {totalCount > prompts.length ? totalCount - prompts.length : "many"}{" "}
            {totalCount > prompts.length ? "more" : "more soon"}
          </span>
          <span className="font-serif text-3xl md:text-5xl font-normal mt-4 leading-[1.05] tracking-[-0.02em]">
            Browse the library
            <ArrowUpRight className="inline-block h-7 w-7 md:h-10 md:w-10 ml-2 -translate-y-1 transition-transform group-hover:translate-x-1 group-hover:-translate-y-2" />
          </span>
        </Link>
      </div>
    </div>
  );
}

/**
 * One prompt rendered as an editorial slot — no card, no border, just typography.
 */
function FeaturedSlot({ prompt }: { prompt: PromptWithAuthor }) {
  const author = prompt.profiles;
  const handle = author?.username ?? "anonymous";
  const model = prompt.model_tag ?? "Any model";

  return (
    <Link
      href={`/prompts/${prompt.slug}`}
      className="snap-start shrink-0 w-[85vw] md:w-[640px] py-6 group"
      aria-label={`Open prompt: ${prompt.title}`}
    >
      {/* Meta row */}
      <div className="flex items-center gap-3 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
        <span className="text-primary font-medium">{model}</span>
        <span aria-hidden="true">·</span>
        <span>@{handle}</span>
      </div>

      {/* Title — large serif, the visual centerpiece */}
      <h3 className="font-serif text-3xl md:text-[44px] font-normal mt-5 mb-6 leading-[1.05] tracking-[-0.025em] text-foreground group-hover:text-primary transition-colors">
        {prompt.title}
      </h3>

      {/* Body excerpt — mono, dimmed, clipped */}
      <p className="font-mono text-[13px] md:text-[14px] leading-[1.7] text-foreground/65 whitespace-pre-wrap line-clamp-6 max-w-[60ch]">
        {renderBody(prompt.body)}
      </p>

      {/* Bottom stats line */}
      <div className="mt-7 flex items-center justify-between gap-4 text-[12px] text-muted-foreground border-t border-border/50 pt-5">
        <span className="tabular-nums">
          {prompt.upvotes ?? 0} upvotes &nbsp;·&nbsp; {prompt.copies ?? 0} copies
        </span>
        <span className="text-foreground/80 font-medium inline-flex items-center gap-1 group-hover:text-primary transition-colors">
          Open prompt
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/**
 * Render prompt body with `{{variables}}` highlighted. Returns a string —
 * for a server component we can't render React nodes inside line-clamp safely
 * (the clamp counts visual lines), so we pass the raw text through.
 *
 * If we wanted highlighted vars in the excerpt, we'd convert this to a client
 * component. For now, plain text reads cleaner and the violet vars live on the
 * /prompts/[slug] page itself.
 */
function renderBody(body: string | null): string {
  return body ?? "";
}
