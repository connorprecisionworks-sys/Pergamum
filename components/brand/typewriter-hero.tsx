"use client";

import { useEffect, useState } from "react";

// Cycled outcomes — keep these short, lowercase, and concrete.
const WORDS = [
  "a product",
  "a storefront",
  "an experience",
  "software",
  "a page",
  "the real thing",
];

const TYPE_MS = 65;
const ERASE_MS = 30;
const HOLD_MS = 1600;
const BETWEEN_MS = 320;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function TypewriterHero() {
  // Initial state: empty — the first character types in on mount, so the caret
  // appears blinking on its own briefly before any text. Reads as intentional.
  const [word, setWord] = useState("");

  useEffect(() => {
    let cancelled = false;

    // Respect users who'd rather not have constant motion.
    if (typeof window !== "undefined") {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        setWord(WORDS[0]);
        return;
      }
    }

    async function run() {
      // Tiny pause before the first word so the page can settle.
      await sleep(450);
      let i = 0;
      while (!cancelled) {
        const target = WORDS[i % WORDS.length];
        // Type forward
        for (let j = 1; j <= target.length; j++) {
          if (cancelled) return;
          setWord(target.slice(0, j));
          await sleep(TYPE_MS);
        }
        // Hold so the user can read it
        await sleep(HOLD_MS);
        if (cancelled) return;
        // Erase backward
        for (let j = target.length - 1; j >= 0; j--) {
          if (cancelled) return;
          setWord(target.slice(0, j));
          await sleep(ERASE_MS);
        }
        await sleep(BETWEEN_MS);
        i++;
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <h1 className="font-serif font-normal text-foreground text-[clamp(2.25rem,6.4vw,4.5rem)] leading-[1.02] tracking-[-0.025em]">
      Ship your prompts as
      <br />
      <span className="inline-flex items-baseline text-primary italic">
        <span className="whitespace-pre" aria-live="polite">
          {word}
        </span>
        <span
          aria-hidden="true"
          className="inline-block w-[3px] h-[0.8em] bg-primary translate-y-[12%] ml-1.5 not-italic animate-pulse"
        />
      </span>
    </h1>
  );
}
