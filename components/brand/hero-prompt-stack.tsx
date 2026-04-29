"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PromptWithAuthor } from "@/lib/types/database";
import { ModelBadge } from "@/components/prompts/model-badge";

interface HeroPromptStackProps {
  prompts: PromptWithAuthor[];
}

// ── Card layout — each one gets a different rotation, offset, and float timing.
// Order is back → middle → front (z-index ascends), so the front card overlaps the others.
const CARD_LAYOUT = [
  {
    rotate: -7,
    x: -90,
    y: -40,
    z: 10,
    floatDelay: 0,
    floatDuration: 6,
  },
  {
    rotate: 4,
    x: 30,
    y: 0,
    z: 20,
    floatDelay: 0.6,
    floatDuration: 7.5,
  },
  {
    rotate: -2,
    x: -10,
    y: 50,
    z: 30,
    floatDelay: 1.2,
    floatDuration: 5.5,
  },
];

export function HeroPromptStack({ prompts }: HeroPromptStackProps) {
  const reduce = useReducedMotion();
  const visible = prompts.slice(0, 3);

  // If we don't have enough prompts to make a real stack, hide the visual
  // rather than ship something half-baked.
  if (visible.length < 2) return null;

  return (
    <div
      className="relative h-[460px] w-full hidden lg:block"
      aria-hidden="true"
    >
      {visible.map((p, i) => {
        const layout = CARD_LAYOUT[i];
        const handle = p.profiles?.username ?? "anonymous";
        const model = p.model_tags?.[0] ?? "any";

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: layout.y + 20 }}
            animate={{ opacity: 1, y: layout.y }}
            transition={{
              duration: 0.6,
              delay: 0.2 + i * 0.12,
              ease: "easeOut",
            }}
            style={{
              rotate: layout.rotate,
              x: layout.x,
              zIndex: layout.z,
            }}
            className="absolute top-1/2 right-0 -translate-y-1/2 w-[320px] origin-center"
          >
            <motion.article
              animate={
                reduce
                  ? undefined
                  : {
                      y: [0, -6, 0],
                    }
              }
              transition={{
                duration: layout.floatDuration,
                delay: layout.floatDelay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="rounded-xl border border-border/70 bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] will-change-transform"
            >
              {/* Top row: model + handle */}
              <div className="flex items-center gap-2 mb-3 text-[11px]">
                <ModelBadge model={model} />
                <span className="text-muted-foreground">@{handle}</span>
              </div>

              {/* Title — serif, 2 lines max */}
              <h3 className="font-serif text-[17px] font-normal leading-[1.25] tracking-tight line-clamp-2 mb-3 text-foreground">
                {p.title}
              </h3>

              {/* Prompt body excerpt — mono, 3 lines */}
              <p className="font-mono text-[11.5px] leading-[1.55] text-foreground/60 line-clamp-3 whitespace-pre-wrap">
                {p.body ?? ""}
              </p>

              {/* Footer stats */}
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[10px] tracking-[0.12em] uppercase text-muted-foreground">
                <span className="tabular-nums">
                  {p.upvotes ?? 0} upvotes
                </span>
                <span className="tabular-nums">
                  {p.copies ?? 0} copies
                </span>
              </div>
            </motion.article>
          </motion.div>
        );
      })}
    </div>
  );
}
