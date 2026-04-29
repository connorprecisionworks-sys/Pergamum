import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChainOfThoughtChart,
  TreeOfThoughtsChart,
  SelfConsistencyChart,
} from "@/components/science/research-charts";

export const metadata: Metadata = {
  title: "The science of structured prompts — Pergamum",
  description:
    "We've all written a vague prompt and spent twenty minutes fixing it. Here's the research on why structure works — and what it changes about the way you write your next one.",
};

// ── Prompt + output examples ──────────────────────────────────────
const VAGUE_PROMPT = `Write a marketing email for our new feature.`;

const VAGUE_OUTPUT = `Subject: Exciting new feature!

Hi there,

We're thrilled to announce a powerful new feature designed to help you achieve more, faster. With our latest update, you'll unlock new capabilities that streamline your workflow and elevate your results.

Whether you're a seasoned pro or just getting started, this feature is built with you in mind.

Try it today and let us know what you think!

Best,
The team`;

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

const STRUCTURED_OUTPUT = `Subject: Stop pasting prompts. Save them.

For growth marketers running 50–500 person teams: we just shipped shared prompt libraries.

If your team copy-pastes the same twelve prompts into ChatGPT every week, you can now save them once, run them with variables, and share them with anyone you invite. No more Notion-doc maintenance. No more Slack-pin archaeology.

Five minutes to set up. Free for the first three seats on your team.

[Try shared prompts →]`;

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
[TRANSCRIPT 1] …`;

// ── Five building blocks ──────────────────────────────────────────
// Each block has a basic example (always shown) and a `whyItMatters` line
// that fades in on hover, explaining what bad output the block prevents.
const BLOCKS = [
  {
    label: "Role / persona",
    description: "Sets the model's frame of reference and the knowledge it draws on.",
    example: '"You are a senior TypeScript engineer reviewing a pull request."',
    whyItMatters:
      "Without a role, the model defaults to a generic helpful assistant. With one, it draws on a much narrower slice of its training and writes accordingly.",
  },
  {
    label: "Context",
    description: "The facts the model needs to avoid guessing them itself.",
    example: '"The codebase uses strict ESLint and targets Node 20."',
    whyItMatters:
      "Missing context is the most common cause of wrong-but-confident answers. Spell out the facts so the model doesn't fill in plausible-sounding ones.",
  },
  {
    label: "Task",
    description: "A single unambiguous instruction. One task per prompt.",
    example: '"Refactor the function below to eliminate the nested conditionals."',
    whyItMatters:
      "Two tasks in one prompt usually means one of them gets a half-effort answer. Split them. Ask one thing at a time, well.",
  },
  {
    label: "Constraints",
    description: "Boundaries that prevent unwanted outputs before they happen.",
    example: '"Do not change the function signature or return type."',
    whyItMatters:
      "Constraints upfront beat corrections after the fact. Every \"don't\" you list saves one round-trip you would have spent fixing it.",
  },
  {
    label: "Output format",
    description: "Tells the model exactly what shape the answer should take.",
    example: '"Return only the refactored function — no explanation."',
    whyItMatters:
      "If you don't say what you want back, you'll get markdown when you wanted JSON, paragraphs when you wanted bullets, and a polite preface either way.",
  },
];

// ── Sources ───────────────────────────────────────────────────────
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
    authors: "Yao et al.",
    year: 2023,
    title: "Tree of Thoughts: Deliberate Problem Solving with Large Language Models",
    url: "https://arxiv.org/abs/2305.10601",
  },
  {
    id: 3,
    authors: "Wang et al.",
    year: 2022,
    title: "Self-Consistency Improves Chain of Thought Reasoning in Language Models",
    url: "https://arxiv.org/abs/2203.11171",
  },
  {
    id: 4,
    authors: "Schulhoff et al.",
    year: 2024,
    title: "The Prompt Report: A Systematic Survey of Prompt Engineering Techniques",
    url: "https://arxiv.org/abs/2406.06608",
  },
];

// ── Anatomy callouts ──────────────────────────────────────────────
const CALLOUTS = [
  { color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300", label: "Role", lines: "Line 1" },
  { color: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300", label: "Context", lines: "Lines 3–7" },
  { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", label: "Constraints", lines: "Lines 12–16" },
  { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", label: "Output format", lines: "Lines 18–20" },
];

export default function TheSciencePage() {
  return (
    <article className="px-6 md:px-10 lg:px-16 py-16 md:py-24">
      {/* ── Editorial header — clinical, not slogan-y ── */}
      <header className="max-w-[760px] mx-auto mb-16 md:mb-20">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-5">
          Research · April 2026 · 6 min read
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,5.6vw,4.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-foreground">
          How prompt structure changes model behaviour.
        </h1>
        <p className="mt-7 text-[18px] md:text-[20px] text-muted-foreground leading-[1.55] max-w-[640px]">
          Three findings from the prompting literature, plus one recent survey that catalogues everything since. We summarise what each measured, what it implies for the prompts you write, and where the evidence stops.
        </p>
        <div className="mt-10 flex items-center gap-4 text-[13px] text-muted-foreground">
          <span>Pergamum Research</span>
          <span className="inline-block h-px w-6 bg-border" aria-hidden="true" />
          <span className="tabular-nums">29 April 2026</span>
        </div>
      </header>

      {/* ── 1. The cost of vague prompts — with side-by-side OUTPUTS ── */}
      <section className="max-w-[760px] mx-auto space-y-7 mb-20 md:mb-28">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
          01 · The cost of vague
        </p>
        <h2 className="font-serif text-[clamp(2rem,4.4vw,3rem)] font-normal leading-[1.1] tracking-[-0.02em]">
          Vague prompts make the model guess.
        </h2>
        <p className="text-[17px] leading-[1.7] text-foreground/85 max-w-[640px]">
          Every round-trip to a language model costs time and tokens. When the input is ambiguous, the model fills in the gaps with whatever the average request looks like — not yours. The fix isn&apos;t a longer back-and-forth. It&apos;s a better first message.
        </p>
        <p className="text-[17px] leading-[1.7] text-foreground/85 max-w-[640px]">
          Here&apos;s the difference, made visible. Same model, same task. The prompts on the left of each pair were both used as the entire input. The outputs on the right are what came back.
        </p>
      </section>

      {/* Side-by-side prompt + output cards — wider than prose column for impact */}
      <section className="max-w-[1100px] mx-auto mb-12 md:mb-16">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Vague — prompt + output */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground/40" aria-hidden="true" />
              Vague prompt
            </div>
            <pre className="rounded-lg border border-border/60 bg-card p-5 text-[13px] leading-[1.7] whitespace-pre-wrap break-words font-mono text-foreground/90">
{VAGUE_PROMPT}
            </pre>
            <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground/80 mt-4">Model output</p>
            <div className="rounded-lg border border-border/60 bg-background-subtle p-5 text-[13px] leading-[1.65] whitespace-pre-wrap break-words text-foreground/75 font-sans">
              {VAGUE_OUTPUT}
            </div>
            <p className="text-xs text-muted-foreground italic">
              Generic, padded, ends with a non-CTA. Twenty minutes from a usable email.
            </p>
          </div>

          {/* Structured — prompt + output */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] uppercase text-primary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              Structured prompt
            </div>
            <pre className="rounded-lg border border-primary/40 bg-card p-5 text-[13px] leading-[1.7] whitespace-pre-wrap break-words font-mono text-foreground/90">
{STRUCTURED_PROMPT}
            </pre>
            <p className="text-[10px] tracking-[0.18em] uppercase text-primary/80 mt-4">Model output</p>
            <div className="rounded-lg border border-primary/40 bg-background-subtle p-5 text-[13px] leading-[1.65] whitespace-pre-wrap break-words text-foreground/85 font-sans">
              {STRUCTURED_OUTPUT}
            </div>
            <p className="text-xs text-muted-foreground italic">
              Specific subject, clear audience, ends with one CTA. Send-ready.
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground max-w-[640px] mx-auto text-center">
          Outputs are illustrative — produced by Claude Sonnet on default settings. Yours will differ.
        </p>
      </section>

      <section className="max-w-[760px] mx-auto mb-24 md:mb-28">
        <p className="text-[17px] leading-[1.7] text-foreground/85">
          The structured version takes about thirty seconds longer to write. It eliminates two to four follow-up messages. On any task you do more than once — every task, eventually — that math gets very good very fast.
        </p>
      </section>

      {/* ── Pull quote — wider than prose, italic serif ── */}
      <aside className="max-w-[920px] mx-auto mb-24 md:mb-32 px-2">
        <div className="border-l-2 border-primary/60 pl-6 md:pl-10">
          <p className="font-serif italic text-[clamp(1.5rem,3.2vw,2.25rem)] leading-[1.25] tracking-[-0.01em] text-foreground/90">
            A vague prompt forces the model to guess. A structured one tells it what to skip.
          </p>
        </div>
      </aside>

      {/* ── 2. The five building blocks ── */}
      <section className="max-w-[760px] mx-auto space-y-7 mb-12 md:mb-16">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
          02 · Anatomy
        </p>
        <h2 className="font-serif text-[clamp(2rem,4.4vw,3rem)] font-normal leading-[1.1] tracking-[-0.02em]">
          Five things every good prompt has.
        </h2>
        <p className="text-[17px] leading-[1.7] text-foreground/85 max-w-[640px]">
          Structure isn&apos;t about being long for its own sake. It&apos;s about removing whole categories of failure before the model ever sees the question. You don&apos;t need every block every time — but you should know which one you&apos;re leaving out, and why.
        </p>
      </section>

      <section className="max-w-[1100px] mx-auto mb-24 md:mb-32">
        <ol className="space-y-1">
          {BLOCKS.map((block, i) => (
            <li
              key={block.label}
              tabIndex={0}
              className="group relative grid grid-cols-[auto_1fr] gap-x-6 md:gap-x-10 gap-y-1 py-6 px-3 md:px-5 border-b border-border/50 last:border-0 cursor-default outline-none transition-[background-color,padding,transform] duration-300 ease-out hover:bg-primary/[0.04] focus-visible:bg-primary/[0.04] hover:md:pl-7 focus-visible:md:pl-7"
            >
              {/* Violet rule that grows from 0 → 3px on hover/focus */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-3 bottom-3 w-[3px] bg-primary scale-y-0 origin-center transition-transform duration-300 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
              />

              <span className="font-serif text-2xl md:text-3xl text-muted-foreground/50 tabular-nums leading-none pt-1 transition-colors duration-300 group-hover:text-primary group-focus-visible:text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="space-y-2">
                <p className="font-serif text-xl md:text-2xl text-foreground tracking-tight leading-tight transition-colors duration-300 group-hover:text-primary group-focus-visible:text-primary">
                  {block.label}
                </p>
                <p className="text-[15px] text-foreground/75 leading-relaxed max-w-[60ch]">
                  {block.description}
                </p>
                <p className="text-[12.5px] font-mono text-muted-foreground/90 mt-2 max-w-[60ch] transition-colors duration-300 group-hover:text-foreground/85 group-focus-visible:text-foreground/85">
                  {block.example}
                </p>

                {/* "Why it matters" — fades + slides in on hover/focus */}
                <p
                  className="
                    text-[14px] italic text-foreground/70 leading-relaxed max-w-[58ch]
                    overflow-hidden
                    max-h-0 opacity-0 mt-0
                    transition-[max-height,opacity,margin-top] duration-300 ease-out
                    group-hover:max-h-32 group-hover:opacity-100 group-hover:mt-3
                    group-focus-visible:max-h-32 group-focus-visible:opacity-100 group-focus-visible:mt-3
                  "
                >
                  {block.whyItMatters}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground mt-6 px-3 md:px-5">
          Hover any row to see why the block matters.
        </p>
      </section>

      {/* ── 3. The research ── */}
      <section className="max-w-[760px] mx-auto space-y-7 mb-12 md:mb-16">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
          03 · The research
        </p>
        <h2 className="font-serif text-[clamp(2rem,4.4vw,3rem)] font-normal leading-[1.1] tracking-[-0.02em]">
          The numbers don&apos;t lie.
        </h2>
        <p className="text-[17px] leading-[1.7] text-foreground/85 max-w-[640px]">
          Three findings spanning the foundational papers (2022) through the more recent reasoning techniques (2023). The 2024 Prompt Report — a systematic survey from a coalition of researchers across Maryland, OpenAI, Stanford, Microsoft, and others — catalogues 58 distinct prompting techniques across the literature, and the same patterns hold across all of them.
        </p>
      </section>

      <section className="max-w-[1100px] mx-auto mb-12 md:mb-16">
        <div className="grid md:grid-cols-3 gap-10 md:gap-12">
          <figure className="space-y-3">
            <figcaption className="space-y-1">
              <p className="font-serif text-xl text-foreground tracking-tight">Chain-of-thought</p>
              <p className="text-xs text-muted-foreground">GSM8K accuracy on PaLM 540B</p>
            </figcaption>
            <ChainOfThoughtChart />
            <p className="text-xs text-muted-foreground italic">
              Asking the model to &ldquo;think step by step&rdquo; jumped accuracy from 17.9% to 56.9% on grade-school math.
            </p>
            <p className="text-[11px] text-muted-foreground/70">Wei et al., 2022 <sup>[1]</sup></p>
          </figure>

          <figure className="space-y-3">
            <figcaption className="space-y-1">
              <p className="font-serif text-xl text-foreground tracking-tight">Tree of Thoughts</p>
              <p className="text-xs text-muted-foreground">Game of 24 success rate, GPT-4</p>
            </figcaption>
            <TreeOfThoughtsChart />
            <p className="text-xs text-muted-foreground italic">
              Letting the model explore and prune multiple reasoning paths takes a task it solves 4% of the time and pushes it to 74%.
            </p>
            <p className="text-[11px] text-muted-foreground/70">Yao et al., 2023 <sup>[2]</sup></p>
          </figure>

          <figure className="space-y-3">
            <figcaption className="space-y-1">
              <p className="font-serif text-xl text-foreground tracking-tight">Self-consistency</p>
              <p className="text-xs text-muted-foreground">GSM8K — CoT vs. CoT + sampling</p>
            </figcaption>
            <SelfConsistencyChart />
            <p className="text-xs text-muted-foreground italic">
              Sampling several chain-of-thought attempts and taking the majority answer adds another 17 points on top.
            </p>
            <p className="text-[11px] text-muted-foreground/70">Wang et al., 2022 <sup>[3]</sup></p>
          </figure>
        </div>
      </section>

      <section className="max-w-[760px] mx-auto space-y-7 mb-16 md:mb-20">
        <p className="text-[17px] leading-[1.7] text-foreground/85">
          These aren&apos;t toy effects, and they aren&apos;t old news. The same patterns show up across the reasoning, coding, and knowledge benchmarks Anthropic, OpenAI, and DeepMind have continued to publish through 2024 and into 2025 — and increasingly across structured-output techniques like Anthropic&apos;s XML-tag prompting (typically 15-20% accuracy lifts on Claude over plain text), DSPy-style program synthesis, and ReAct-style tool use. Structure remains the cheapest performance lever you have access to: a minute of writing, and a model that performs as if it were a tier larger than it actually is.
        </p>

        {/* Sources */}
        <div className="border-l-2 border-border pl-6 py-1 space-y-3 mt-8">
          <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground">Sources</p>
          <ol className="space-y-2.5">
            {SOURCES.map((s) => (
              <li key={s.id} className="text-[13px] text-foreground/75 leading-relaxed">
                <span className="font-mono text-[11px] mr-2 text-muted-foreground">[{s.id}]</span>
                {s.authors} ({s.year}). <em>{s.title}.</em>{" "}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  arxiv.org
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 4. Anatomy of a great prompt ── */}
      <section className="max-w-[760px] mx-auto space-y-7 mb-12 md:mb-16">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
          04 · A real prompt, dissected
        </p>
        <h2 className="font-serif text-[clamp(2rem,4.4vw,3rem)] font-normal leading-[1.1] tracking-[-0.02em]">
          What it looks like in the wild.
        </h2>
        <p className="text-[17px] leading-[1.7] text-foreground/85 max-w-[640px]">
          Every block from the previous section, in a single prompt you could drop into your workflow today. The callouts on the right map each block to the lines it covers.
        </p>
      </section>

      <section className="max-w-[1100px] mx-auto mb-24 md:mb-32">
        <div className="grid md:grid-cols-5 gap-6 md:gap-8 items-start">
          <pre className="md:col-span-3 rounded-lg border border-border/60 bg-background-subtle p-5 md:p-6 text-[13px] leading-[1.7] whitespace-pre-wrap break-words font-mono text-foreground/90">
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
            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              The task itself is the shortest part. That&apos;s usually a sign you got the rest right.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. The takeaway + CTA ── */}
      <section className="max-w-[760px] mx-auto space-y-7 mb-16">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
          What this means for you
        </p>
        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em]">
          Write the prompt you wish you&apos;d been handed.
        </h2>
        <p className="text-[17px] leading-[1.7] text-foreground/85">
          The prompts you write today are tools you&apos;ll use a thousand times. Treat each one like a piece of software: name it, version it, share it, improve it. The first one you save is worth maybe an hour. The hundredth is worth a month.
        </p>
        <p className="text-[17px] leading-[1.7] text-foreground/85">
          That&apos;s what Pergamum is for. It&apos;s a free, open library of prompts — the ones that actually earn their keep. Every prompt has its variables broken out as fillable inputs, every one is tagged for the model it was tuned on, and every one is yours to copy, fork, and remix.
        </p>
      </section>

      <section className="max-w-[760px] mx-auto border-t border-border/60 pt-12 mt-8 flex items-center gap-5 flex-wrap">
        <Button size="lg" asChild className="h-12 px-7 text-[15px]">
          <Link href="/prompts">Browse the library</Link>
        </Button>
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground hover:text-primary transition-colors"
        >
          Submit your own →
        </Link>
      </section>
    </article>
  );
}
