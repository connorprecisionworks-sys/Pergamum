"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface HeroImagePromptProps {
  name: string;
  summary: string;
  sourceUrl: string;
}

function buildPrompt(name: string, summary: string, sourceUrl: string): string {
  const n = name.trim() || "(your skill’s name)";
  const s = summary.trim() || "(a one-sentence description)";
  const u =
    sourceUrl.trim() ||
    "(your skill’s source URL — paste the GitHub repo, marketplace listing, or marketing page here)";

  return `Create a wide hero image (16:9 aspect ratio, ~1600x900px) for a
Claude Code skill called "${n}".

What the skill does: ${s}

If you have web access, browse the skill's actual marketing or
source page for visual cues:
${u}

Style requirements:
- Editorial and modern — think Stripe Docs, Linear, Vercel,
  Anthropic.com
- One strong visual concept, not a busy collage
- Clear focal point, intentional negative space
- Color: predominantly dark background (around #08080b) with a
  single accent color that fits what the skill does
- Typography is welcome if the type IS the design (like Remotion’s
  “Make videos programmatically” hero) — otherwise omit text
- NO generic “AI” imagery, glowing brains, abstract neon swooshes,
  cyberpunk aesthetics, fake people, or stock-photo feel
- YES clean typographic treatment, subtle gradient, a metaphor for
  what the skill does (not a literal screenshot)

The image will sit in a directory card at roughly 400px wide, so the
concept must read instantly at thumbnail scale.

Output: a single 16:9 image, PNG or WebP.`;
}

export function HeroImagePrompt({ name, summary, sourceUrl }: HeroImagePromptProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(name, summary, sourceUrl);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(prompt)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
        toast.success("Prompt copied — paste it into your AI image tool.");
      })
      .catch(() => {
        toast.error("Couldn’t copy. Select the text manually.");
      });
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
        Don&apos;t have a hero image yet? Generate one with AI
      </button>

      {open && (
        <div className="mt-3 bg-background-inset border border-border rounded-md p-4 space-y-3">
          <p className="text-sm text-foreground-muted leading-relaxed">
            Paste this into your favorite AI image tool (ChatGPT, Claude, Midjourney, DALL&middot;E,
            Ideogram, Krea). It already includes your skill&apos;s name, summary, and source URL.
          </p>

          <pre className="font-mono text-[12px] whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-900/60 rounded-md p-3 max-h-64 overflow-y-auto leading-relaxed text-foreground">
            {prompt}
          </pre>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-sm font-medium border border-border rounded-md px-3 py-1.5 bg-background hover:bg-background-subtle transition-colors"
            >
              {copied ? (
                <span className="text-emerald-600 dark:text-emerald-400">&#10003; Copied</span>
              ) : (
                "Copy prompt"
              )}
            </button>

            <span className="font-mono text-[11px] text-foreground-subtle">Try with:</span>

            <a
              href={`https://claude.ai/new?q=${encodeURIComponent(prompt)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground-muted hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Claude
            </a>
            <a
              href="https://midjourney.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground-muted hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Midjourney
            </a>
          </div>

          <p className="text-[11px] text-foreground-subtle leading-relaxed">
            Tip: tools with web browsing (Claude, ChatGPT-5) can look at your source URL for visual
            cues. Midjourney users &mdash; append{" "}
            <span className="font-mono">--ar 16:9</span> to the prompt.
          </p>
        </div>
      )}
    </div>
  );
}
