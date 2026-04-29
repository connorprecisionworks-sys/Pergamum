"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PromptWithAuthor } from "@/lib/types/database";
import { ModelBadge } from "@/components/prompts/model-badge";

interface HeroPromptStackProps {
  prompts: PromptWithAuthor[];
}

// ── File-cabinet stack —————————————————————————————————————
// Cards stay stacked at fixed positions (each peeking ~14px below the one
// in front of it, like files in a drawer). One at a time, a card pulls UP
// out of its slot to reveal its full contents, holds, then drops back in.
// Then the next card takes its turn.

// Resting position for each card in the stack (front → back).
const STACK_LAYOUT = [
  { restY: 0,  restZ: 30 }, // front
  { restY: 14, restZ: 20 }, // middle
  { restY: 28, restZ: 10 }, // back
];

// Where the active card sits when "pulled up" out of the stack.
const ACTIVE_Y = -170;
const ACTIVE_Z = 50;

const HOLD_MS = 4200;

export function HeroPromptStack({ prompts }: HeroPromptStackProps) {
  const reduce = useReducedMotion();
  const visible = prompts.slice(0, 3);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduce || visible.length < 2) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % visible.length);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, [visible.length, reduce]);

  // Need at least two cards for the stack effect to read.
  if (visible.length < 2) return null;

  return (
    <div
      className="relative h-[720px] w-full hidden lg:block"
      aria-hidden="true"
    >
      {visible.map((p, i) => {
        const isActive = i === activeIndex;
        const layout = STACK_LAYOUT[i] ?? STACK_LAYOUT[0];
        const handle = p.profiles?.username ?? "anonymous";
        const model = p.model_tags?.[0] ?? "any";

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: layout.restY + 30 }}
            animate={{
              opacity: 1,
              y: isActive ? ACTIVE_Y : layout.restY,
              scale: isActive ? 1.03 : 1,
              zIndex: isActive ? ACTIVE_Z : layout.restZ,
            }}
            transition={{
              duration: 0.7,
              ease: [0.32, 0.72, 0, 1], // springy slide-out feel
            }}
            className="absolute top-1/2 right-0 w-full -translate-y-1/2 will-change-transform"
          >
            <article className="rounded-xl border border-border/70 bg-card p-8 shadow-[0_18px_56px_rgba(0,0,0,0.10)] dark:shadow-[0_22px_72px_rgba(0,0,0,0.55)]">
              {/* Top row: model + handle */}
              <div className="flex items-center gap-2.5 mb-6 text-[13px]">
                <ModelBadge model={model} />
                <span className="text-muted-foreground">@{handle}</span>
              </div>

              {/* Title */}
              <h3 className="font-serif text-[30px] font-normal leading-[1.15] tracking-tight line-clamp-2 mb-5 text-foreground">
                {p.title}
              </h3>

              {/* Body excerpt — bigger, more lines, more breathing room */}
              <p className="font-mono text-[15px] leading-[1.7] text-foreground/65 line-clamp-6 whitespace-pre-wrap">
                {p.body ?? ""}
              </p>

              {/* Footer stats */}
              <div className="mt-8 pt-5 border-t border-border/50 flex items-center justify-between text-[11.5px] tracking-[0.14em] uppercase text-muted-foreground">
                <span className="tabular-nums">
                  {p.upvotes ?? 0} upvotes
                </span>
                <span className="tabular-nums">
                  {p.copies ?? 0} copies
                </span>
              </div>
            </article>
          </motion.div>
        );
      })}

      {/* Stack indicator dots — match parent width */}
      <div className="absolute bottom-2 right-0 w-full flex items-center justify-center gap-1.5 z-[60]">
        {visible.map((_, i) => (
          <span
            key={i}
            className={
              "h-1 rounded-full transition-all duration-500 " +
              (i === activeIndex
                ? "w-6 bg-primary"
                : "w-1 bg-foreground/20")
            }
          />
        ))}
      </div>
    </div>
  );
}
