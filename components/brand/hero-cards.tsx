"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import type { PromptWithAuthor } from "@/lib/types/database";

interface HeroCardsProps {
  prompts: PromptWithAuthor[];
}

const CARD_CONFIG = [
  { rotate: -4,   x: -12, y: 0,   depth: 0.5, zIndex: 1 },
  { rotate:  2.5, x:  16, y: 32,  depth: 0.75, zIndex: 2 },
  { rotate: -1.5, x:  0,  y: 64,  depth: 1.0,  zIndex: 3 },
];

export function HeroCards({ prompts }: HeroCardsProps) {
  const shouldReduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const rawY = useMotionValue(0);
  const smoothY = useSpring(rawY, { damping: 25, stiffness: 80 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduce || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relY = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
    rawY.set(relY * 14);
  };

  const handleMouseLeave = () => {
    rawY.set(0);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-[420px] w-full select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      {prompts.slice(0, 3).map((prompt, i) => {
        const cfg = CARD_CONFIG[i];
        return (
          <motion.div
            key={prompt.id}
            className="absolute w-full max-w-[320px] left-1/2"
            style={{
              rotate: cfg.rotate,
              x: cfg.x - 160, // center offset
              top: cfg.y,
              y: shouldReduce ? 0 : smoothY,
              zIndex: cfg.zIndex,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div
              className="rounded-lg border border-border bg-background-subtle p-4"
              style={{
                boxShadow: "0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(147,112,219,0.08)",
              }}
            >
              <div className="label-mono mb-2">
                {prompt.categories?.name ?? "Prompt"}
              </div>
              <p className="font-serif text-[15px] font-medium leading-snug text-foreground line-clamp-2 mb-2">
                {prompt.title}
              </p>
              {prompt.description && (
                <p className="text-[12px] text-foreground-muted line-clamp-2 leading-relaxed">
                  {prompt.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                <span className="label-mono">
                  {prompt.upvotes} up
                </span>
                <span className="label-mono">
                  {prompt.views} uses
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
