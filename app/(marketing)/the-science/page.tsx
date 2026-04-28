import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChainOfThoughtChart,
  FewShotChart,
  SelfConsistencyChart,
} from "@/components/science/research-charts";

export const metadata: Metadata = {
  title: "The Science Behind Structured Prompts — Pergamum",
  description:
    "Research-backed evidence for why structured prompts outperform vague ones — chain-of-thought, few-shot learning, self-consistency, and what that means for your workflow.",
};

const VAGUE_PROMPT = `Write a marketing email for our new feature.`;

const STRUCTURED_PROMPT = `You are a B2B SaaS copywriter who specialises in product launches.

Context: We are launching a collaborative prompt library for teams.
The audience is growth marketers at 50–500 person software companies.
They care about saving time and repeatable results.

Task: Write a launch announcement email for our new shared prompt library.

Constraints:
- Subject line under 50 characters
- Body under 180 words
- No jargon ("synergy", "leverage", "game-changer")
- End with exactly one CTA linking to the product page

Output format: Plain text. Subject line first, then body.`;

const ANATOMY_PROMPT = `You are a UX researcher who specialises in B2B software.
# Context
I conducted 6 customer interviews this week. Each transcript is pasted below,
separated by "---". Participants were asked about their current prompt
workflows and pain points.

# Task
Summarise the interviews into a concise research brief.

# Constraints
- Max 400 words total
- Group findings by theme, not by participant
- Exclude anything mentioned only once (not a pattern)
- Flag any direct quotes worth keeping verbatim

# Output format
Markdown. Top-level heading per theme. Bullet points for findings.
Quotes in > blockquotes. End with a "Key tensions" section.

---
[TRANSCRIPT 1] ...`;

const BLOCKS = [
  {
    label: "Role / persona",
    description: "Sets the model's frame of reference and implicit knowledge.",
    example: '"You are a senior TypeScript engineer reviewing a pull request."',
  },
  {
    label: "Context",
    description: "Gives the model the facts it needs to avoid guessing.",
    example: '"The codebase uses strict ESLint and targets Node 20."',
  },
  {
    label: "Task",
    description: "A single, unambiguous instruction. One task per prompt.",
    example: '"Refactor the function below to eliminate the nested conditionals."',
  },
  {
    label: "Constraints",
    description: "Boundaries that prevent unwanted outputs before they happen.",
    example: '"Do not change the function signature or return type."',
  },
  {
    label: "Output format",
    description: "Tells the model exactly what shape the answer should take.",
    example: '"Return only the refactored function — no explanation."',
  },
];

const SOURCES = [
  {
    id: 1,
    authors: "Wei et al.",
    year: 2022,
    title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
    url: "https://arxiv.org/abs/2201.11903",
  },
  {
    id: 2,
    authors: "Brown et al.",
    year: 2020,
    title: "Language Models are Few-Shot Learners",
    url: "https://arxiv.org/abs/2005.14165",
  },
  {
    id: 3,
    authors: "Wang et al.",
    year: 2022,
    title: "Self-Consistency Improves Chain of Thought Reasoning in Language Models",
    url: "https://arxiv.org/abs/2203.11171",
  },
];

const CALLOUTS = [
  { color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300", label: "Role", lines: "Line 1" },
  { color: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",             label: "Context", lines: "Lines 2–8" },
  { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",      label: "Constraints", lines: "Lines 10–14" },
  { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", label: "Output format", lines: "Lines 16–18" },
];

export default function TheSciencePage() {
  return (
    <div className="container max-w-4xl py-16 md:py-24 space-y-24">

      {/* ── 1. Hero ── */}
      <section className="space-y-6">
        <h1 className="font-serif text-6xl md:text-7xl font-normal leading-[0.95] tracking-tight">
          Prompts are software.<br />
          <span className="text-primary">Treat them that way.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          A short tour of the research showing why structured prompts beat lazy
          ones — and what that means for the prompts you write tomorrow.
        </p>
      </section>

      {/* ── 2. The cost of vague prompts ── */}
      <section className="space-y-8">
        <div className="space-y-2">
          <span className="label-mono">[ 01 — THE COST OF VAGUE ]</span>
          <h2 className="font-serif text-4xl font-normal tracking-tight">
            Vague prompts waste iterations.
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Every round-trip to the model costs time and tokens. When your input is
          ambiguous, the model guesses — and its guess is calibrated to the
          average request, not yours. The fix isn&apos;t a longer conversation.
          It&apos;s a better first message.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="label-mono text-destructive">[ VAGUE ]</p>
            <pre className="rounded-lg border border-border/60 bg-background-subtle p-4 text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-foreground">
              {VAGUE_PROMPT}
            </pre>
          </div>
          <div className="space-y-2">
            <p className="label-mono text-primary">[ STRUCTURED ]</p>
            <pre className="rounded-lg border border-primary/30 bg-background-subtle p-4 text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-foreground">
              {STRUCTURED_PROMPT}
            </pre>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          The structured version takes 30 seconds longer to write and eliminates
          2–4 follow-up messages — a net time save on any task you do more than once.
        </p>
      </section>

      {/* ── 3. What 'structured' actually means ── */}
      <section className="space-y-8">
        <div className="space-y-2">
          <span className="label-mono">[ 02 — FIVE BUILDING BLOCKS ]</span>
          <h2 className="font-serif text-4xl font-normal tracking-tight">
            What &ldquo;structured&rdquo; actually means.
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          A structured prompt isn&apos;t longer for its own sake. It&apos;s longer
          because each of these five components eliminates a whole class of bad
          outputs. You don&apos;t need all five every time — but you should know
          which one you&apos;re leaving out and why.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BLOCKS.map((block) => (
            <div
              key={block.label}
              className="rounded-lg border border-border/60 bg-card p-5 space-y-2"
            >
              <p className="font-medium text-foreground text-sm">{block.label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {block.description}
              </p>
              <p className="text-xs font-mono text-muted-foreground bg-background-subtle rounded px-2 py-1.5 leading-relaxed">
                {block.example}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. The research ── */}
      <section className="space-y-10">
        <div className="space-y-2">
          <span className="label-mono">[ 03 — THE RESEARCH ]</span>
          <h2 className="font-serif text-4xl font-normal tracking-tight">
            Numbers don&apos;t lie.
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Three findings from peer-reviewed ML research, all replicable and
          widely cited. We&apos;re not cherry-picking; these are the landmark
          papers in the prompting literature.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Chart 1 */}
          <div className="space-y-3">
            <p className="font-medium text-sm text-foreground">
              Chain-of-thought prompting
            </p>
            <p className="text-xs text-muted-foreground">
              GSM8K accuracy — standard vs. chain-of-thought
            </p>
            <ChainOfThoughtChart />
            <p className="text-xs text-muted-foreground">
              Source: Wei et al., 2022 <sup>[1]</sup>
            </p>
          </div>

          {/* Chart 2 */}
          <div className="space-y-3">
            <p className="font-medium text-sm text-foreground">
              Few-shot examples
            </p>
            <p className="text-xs text-muted-foreground">
              TriviaQA accuracy on GPT-3 175B
            </p>
            <FewShotChart />
            <p className="text-xs text-muted-foreground">
              Source: Brown et al., 2020 <sup>[2]</sup>
            </p>
          </div>

          {/* Chart 3 */}
          <div className="space-y-3">
            <p className="font-medium text-sm text-foreground">
              Self-consistency
            </p>
            <p className="text-xs text-muted-foreground">
              GSM8K — CoT alone vs. CoT + self-consistency
            </p>
            <SelfConsistencyChart />
            <p className="text-xs text-muted-foreground">
              Source: Wang et al., 2022 <sup>[3]</sup>
            </p>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          These aren&apos;t toy effects. The same patterns show up across
          reasoning, coding, and knowledge tasks — every benchmark Anthropic,
          OpenAI, and DeepMind have published on. Structure is the cheapest
          performance lever you have access to.
        </p>

        {/* Sources */}
        <div className="rounded-lg border border-border/60 bg-background-subtle p-5 space-y-3">
          <p className="label-mono">[ SOURCES ]</p>
          <ol className="space-y-2">
            {SOURCES.map((s) => (
              <li key={s.id} className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-mono text-xs mr-2 text-foreground-subtle">[{s.id}]</span>
                {s.authors} ({s.year}).{" "}
                <em>{s.title}.</em>{" "}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:no-underline"
                >
                  {s.url}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 5. Anatomy of a great prompt ── */}
      <section className="space-y-8">
        <div className="space-y-2">
          <span className="label-mono">[ 04 — ANATOMY ]</span>
          <h2 className="font-serif text-4xl font-normal tracking-tight">
            A real prompt, dissected.
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Every component from Section 2 in a single prompt — one you could
          drop into your workflow today. The callouts below map each label to
          the lines it covers.
        </p>

        <div className="grid md:grid-cols-5 gap-6 items-start">
          <pre className="md:col-span-3 rounded-lg border border-border/60 bg-background-subtle p-5 text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-foreground">
            {ANATOMY_PROMPT}
          </pre>
          <div className="md:col-span-2 space-y-3">
            {CALLOUTS.map((c) => (
              <div
                key={c.label}
                className={`rounded-lg px-4 py-3 space-y-0.5 ${c.color}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide">{c.label}</p>
                <p className="text-xs opacity-80">{c.lines}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              The task section is intentionally blank here — you&apos;d paste
              the transcript text in before sending.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. CTA ── */}
      <section className="rounded-xl border border-border/60 bg-background-subtle px-8 py-12 space-y-6 text-center">
        <h2 className="font-serif text-4xl md:text-5xl font-normal tracking-tight">
          Got a prompt that earns its keep?
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Submit it to the library. Other people who write prompts for a living
          will thank you.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button size="lg" asChild>
            <Link href="/submit">Submit a prompt</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/prompts">Browse the library</Link>
          </Button>
        </div>
      </section>

    </div>
  );
}
