"use client";

import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Scenes that cycle through the demo ─────────────────────────────
type Scene = {
  topic: string;
  tone: string;
};

const SCENES: Scene[] = [
  { topic: "customer interview notes", tone: "crisp, direct" },
  { topic: "release notes for engineers", tone: "specific, no jargon" },
  { topic: "cold email opener", tone: "warm, curious" },
];

const TYPE_MS = 42;
const ERASE_MS = 18;
const BETWEEN_FIELD_MS = 350;
const HOLD_MS = 2400;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type ActiveField = "topic" | "tone" | null;

export function LiveDemo() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [active, setActive] = useState<ActiveField>("topic");
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;

    // Respect reduced-motion preference: skip animation, show one filled scene.
    if (typeof window !== "undefined") {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        setTopic(SCENES[0].topic);
        setTone(SCENES[0].tone);
        setActive(null);
        return;
      }
    }

    async function typeIn(target: string, setter: (v: string) => void) {
      for (let i = 0; i <= target.length; i++) {
        if (cancelRef.current) return;
        setter(target.slice(0, i));
        await sleep(TYPE_MS);
      }
    }
    async function eraseFrom(current: string, setter: (v: string) => void) {
      for (let i = current.length; i >= 0; i--) {
        if (cancelRef.current) return;
        setter(current.slice(0, i));
        await sleep(ERASE_MS);
      }
    }

    async function run() {
      // Brief intro pause so the page settles before typing starts.
      await sleep(900);
      let i = 0;
      while (!cancelRef.current) {
        const scene = SCENES[i % SCENES.length];

        setActive("topic");
        await typeIn(scene.topic, setTopic);
        if (cancelRef.current) return;
        await sleep(BETWEEN_FIELD_MS);

        setActive("tone");
        await typeIn(scene.tone, setTone);
        if (cancelRef.current) return;
        setActive(null);
        await sleep(HOLD_MS);

        setActive("tone");
        await eraseFrom(scene.tone, setTone);
        if (cancelRef.current) return;
        setActive("topic");
        await eraseFrom(scene.topic, setTopic);
        if (cancelRef.current) return;

        i++;
      }
    }

    run();
    return () => {
      cancelRef.current = true;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-10 md:gap-14 items-start">
      {/* Prompt body — left */}
      <div className="font-mono text-[13.5px] md:text-[14.5px] leading-[1.95] text-foreground/85 selection:bg-primary/20">
        <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-3 font-sans">
          Prompt
        </div>
        <p>You are a senior product researcher.</p>
        <p className="mt-3">Read the notes below and produce:</p>
        <p>1. The top three pain points, in priority order.</p>
        <p>
          2. One concrete <Var value="Jira ticket" filled />.
        </p>
        <p className="break-words">
          3. A <Var value={tone} placeholder="tone" filled={tone.length > 0} />,
          {" "}&lt;120-word summary about{" "}
          <Var value={topic} placeholder="topic" filled={topic.length > 0} />.
        </p>
      </div>

      {/* Inputs — right */}
      <div className="md:pl-2">
        <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-3 font-sans">
          Variables
        </div>

        <Field label="topic" value={topic} active={active === "topic"} />
        <Field label="tone" value={tone} active={active === "tone"} />

        <button
          type="button"
          aria-label="Copy filled prompt (demo)"
          className="mt-7 inline-flex items-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copy filled prompt
        </button>
        <p className="mt-3 text-[12px] text-muted-foreground">
          This is a live demo. The real thing copies in one click.
        </p>
      </div>
    </div>
  );
}

// ── Inline variable token in the prompt body ───────────────────────
function Var({
  value,
  placeholder,
  filled,
}: {
  value: string;
  placeholder?: string;
  filled: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline px-1.5 rounded-[3px] transition-colors duration-200",
        filled
          ? "bg-primary/12 text-primary"
          : "bg-foreground/[0.04] text-muted-foreground"
      )}
    >
      {filled ? value : `{{${placeholder ?? ""}}}`}
    </span>
  );
}

// ── Editable-feeling field with the typing caret ───────────────────
function Field({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="border-b border-border/80 pb-2.5 mb-4 last:mb-0">
      <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground/80 font-sans">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[14px] md:text-[15px] text-foreground min-h-[1.55em] flex items-baseline">
        <span>{value || " "}</span>
        <span
          aria-hidden="true"
          className={cn(
            "inline-block w-[2px] h-[1em] bg-primary translate-y-[2px] ml-[1px] transition-opacity",
            active ? "opacity-100 animate-pulse" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
}
