"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { PromptExample } from "@/lib/types/database";

// ─── Types ────────────────────────────────────────────────────────
export type BlockKey = "role" | "context" | "task" | "constraints" | "output_format";
export type ActionTarget = BlockKey | "examples";

export interface StrengthData {
  role: string;
  context: string;
  task: string;
  constraints: string;
  output_format: string;
}

interface StrengthProps {
  data: StrengthData;
  examples?: PromptExample[];
  title?: string;
  thinking?: boolean;
  onActionClick?: (target: ActionTarget) => void;
}

// ─── Scoring ──────────────────────────────────────────────────────
// Pure heuristics — no API call, no token. All scores are on a 0-100 scale,
// and the overall score is a weighted average. The point isn't precision:
// it's giving the user a nudge toward the things that genuinely lift quality
// in prompt engineering practice.

const FILLED_THRESHOLD = 1; // any non-empty content counts as "filled"
const SHORT_BLOCK = 20;
const HEALTHY_BLOCK = 60;

function len(s: string): number {
  return s.trim().length;
}

function variableCount(...blocks: string[]): number {
  const seen = new Set<string>();
  for (const b of blocks) {
    for (const m of b.matchAll(/\{\{(\w+)\}\}/g)) seen.add(m[1]);
  }
  return seen.size;
}

/**
 * Structure: how many of the 5 blocks have any content. Linear 0-100.
 * Single most reliable predictor that the prompt won't fall apart.
 */
function scoreStructure(d: StrengthData): number {
  const filled = [d.role, d.context, d.task, d.constraints, d.output_format].filter(
    (v) => len(v) >= FILLED_THRESHOLD
  ).length;
  return Math.round((filled / 5) * 100);
}

/**
 * Specificity: are role and task concrete vs generic? Heuristic — penalises
 * very short or empty Role/Task, rewards length and the presence of
 * "specialist" markers (named domain, seniority, named action verb).
 */
function scoreSpecificity(d: StrengthData): number {
  const role = d.role.trim();
  const task = d.task.trim();

  let roleScore = 0;
  if (role.length === 0) roleScore = 0;
  else if (role.length < SHORT_BLOCK) roleScore = 25;
  else if (role.length < HEALTHY_BLOCK) roleScore = 65;
  else roleScore = 80;

  // Bonus: role contains a specificity marker
  const SPECIFICITY_MARKERS = /\b(senior|specialise|specialize|expert|veteran|principal|lead|consultant|researcher|engineer|copywriter|editor|analyst|strategist)\b/i;
  if (SPECIFICITY_MARKERS.test(role)) roleScore = Math.min(100, roleScore + 15);

  let taskScore = 0;
  if (task.length === 0) taskScore = 0;
  else if (task.length < SHORT_BLOCK) taskScore = 30;
  else if (task.length < HEALTHY_BLOCK) taskScore = 70;
  else taskScore = 85;

  // Bonus: task starts with a clear imperative verb
  const IMPERATIVE_START = /^\s*(write|generate|summari[sz]e|extract|review|draft|create|analyse|analyze|translate|rewrite|classify|outline|explain|propose|compare|critique|design|build|plan|score|rank|list)\b/i;
  if (IMPERATIVE_START.test(task)) taskScore = Math.min(100, taskScore + 15);

  return Math.round((roleScore + taskScore) / 2);
}

/**
 * Guidance: are constraints and output format set? These are the blocks
 * that prevent rambling outputs and ensure consistent shape.
 */
function scoreGuidance(d: StrengthData): number {
  const c = d.constraints.trim();
  const o = d.output_format.trim();

  let cScore = 0;
  if (c.length === 0) cScore = 0;
  else if (c.length < SHORT_BLOCK) cScore = 35;
  else if (c.length < HEALTHY_BLOCK) cScore = 70;
  else cScore = 90;

  // Bonus: constraints use bullet points (concrete rules, not prose)
  if (/^[-*•]/m.test(c)) cScore = Math.min(100, cScore + 10);

  let oScore = 0;
  if (o.length === 0) oScore = 0;
  else if (o.length < 15) oScore = 40;
  else if (o.length < 60) oScore = 75;
  else oScore = 90;

  return Math.round((cScore + oScore) / 2);
}

/**
 * Reusability: is this prompt designed to run again with new inputs? Variables
 * and few-shot examples both push this up.
 */
function scoreReusability(d: StrengthData, examples: PromptExample[]): number {
  const vars = variableCount(d.role, d.context, d.task, d.constraints, d.output_format);
  const examplesUsed = examples.filter(
    (e) => e.input.trim().length > 0 || e.output.trim().length > 0
  ).length;

  let varScore = 0;
  if (vars === 0) varScore = 10;
  else if (vars === 1) varScore = 55;
  else if (vars === 2) varScore = 75;
  else varScore = 85;

  let exScore = 0;
  if (examplesUsed === 0) exScore = 0;
  else if (examplesUsed === 1) exScore = 60;
  else exScore = 90;

  // Combine: variables matter slightly more for reusability than examples.
  return Math.round(varScore * 0.6 + exScore * 0.4);
}

interface Scores {
  structure: number;
  specificity: number;
  guidance: number;
  reusability: number;
  overall: number;
}

function computeScores(d: StrengthData, examples: PromptExample[]): Scores {
  const structure = scoreStructure(d);
  const specificity = scoreSpecificity(d);
  const guidance = scoreGuidance(d);
  const reusability = scoreReusability(d, examples);

  // Weighted overall — Structure carries the most weight because a missing
  // block is harder to recover from than a slightly-vague one.
  const overall = Math.round(
    structure * 0.3 + specificity * 0.25 + guidance * 0.25 + reusability * 0.2
  );

  return { structure, specificity, guidance, reusability, overall };
}

// ─── Suggestions ──────────────────────────────────────────────────
interface Suggestion {
  id: string;
  text: string;
  target: ActionTarget;
  cta: string;
}

function buildSuggestions(d: StrengthData, examples: PromptExample[]): Suggestion[] {
  const out: Suggestion[] = [];
  const role = d.role.trim();
  const context = d.context.trim();
  const task = d.task.trim();
  const constraints = d.constraints.trim();
  const output = d.output_format.trim();
  const exampleCount = examples.filter(
    (e) => e.input.trim().length > 0 || e.output.trim().length > 0
  ).length;
  const vars = variableCount(d.role, d.context, d.task, d.constraints, d.output_format);

  // Order matters — most impactful gaps first.
  if (!role) {
    out.push({
      id: "no-role",
      text: "No role set — the model defaults to a generic helper.",
      target: "role",
      cta: "Add role",
    });
  } else if (role.length < SHORT_BLOCK) {
    out.push({
      id: "short-role",
      text: "Role is generic. Name a specific persona and what they specialise in.",
      target: "role",
      cta: "Sharpen",
    });
  }

  if (!task) {
    out.push({
      id: "no-task",
      text: "No task. The whole prompt needs one clear instruction.",
      target: "task",
      cta: "Add task",
    });
  } else if (task.length < SHORT_BLOCK) {
    out.push({
      id: "short-task",
      text: "Task is short. Start with a verb and be concrete about the deliverable.",
      target: "task",
      cta: "Sharpen",
    });
  }

  if (!constraints) {
    out.push({
      id: "no-constraints",
      text: "No constraints. Outputs will tend to ramble or include unwanted shapes.",
      target: "constraints",
      cta: "Add constraints",
    });
  }

  if (!output) {
    out.push({
      id: "no-output-format",
      text: "No output format. Specify the exact shape you want back.",
      target: "output_format",
      cta: "Add format",
    });
  }

  if (!context) {
    out.push({
      id: "no-context",
      text: "No context. Even one sentence about the situation lifts quality.",
      target: "context",
      cta: "Add context",
    });
  }

  if (vars === 0 && role.length > 0 && task.length > 0) {
    out.push({
      id: "no-variables",
      text:
        "No {{variables}}. Mark the parts that should change between runs to make this reusable.",
      target: "context",
      cta: "Open editor",
    });
  }

  if (exampleCount === 0 && (role || task)) {
    out.push({
      id: "no-examples",
      text:
        "No few-shot examples. One or two input → output pairs is the single biggest quality lever.",
      target: "examples",
      cta: "Add example",
    });
  }

  return out.slice(0, 5); // cap to keep the panel calm
}

// ─── Component ────────────────────────────────────────────────────
export function PromptStrength({
  data,
  examples = [],
  title,
  thinking,
  onActionClick,
}: StrengthProps) {
  const reduceMotion = useReducedMotion();
  const scores = useMemo(() => computeScores(data, examples), [data, examples]);
  const suggestions = useMemo(() => buildSuggestions(data, examples), [data, examples]);

  const overallVerdict =
    scores.overall === 0
      ? "Empty"
      : scores.overall < 35
      ? "Sketch"
      : scores.overall < 60
      ? "Working draft"
      : scores.overall < 80
      ? "Solid"
      : "Production-ready";

  return (
    <div className="w-full max-w-[640px] mx-auto space-y-5">
      {/* Overall score */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-medium">
            Prompt strength
          </p>
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground tabular-nums">
            {overallVerdict}
          </p>
        </div>
        <div className="flex items-end gap-3">
          <p
            className={`font-serif text-[clamp(2.5rem,5vw,3.75rem)] leading-none tabular-nums tracking-tight ${scoreColorClass(
              scores.overall
            )}`}
          >
            {scores.overall}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground tabular-nums pb-1.5">
            / 100
          </p>
        </div>
        <Bar
          value={scores.overall}
          height={10}
          accent
          reduceMotion={!!reduceMotion}
          thinking={thinking ?? false}
        />
        {title && (
          <p className="mt-3 font-serif text-base md:text-lg text-foreground tracking-tight">
            {title}
          </p>
        )}
      </div>

      {/* Sub-dimension bars */}
      <div className="space-y-2.5">
        <SubBar
          label="Structure"
          tooltip="How many of the 5 blocks are filled in."
          value={scores.structure}
          reduceMotion={!!reduceMotion}
        />
        <SubBar
          label="Specificity"
          tooltip="Whether your role and task are concrete instead of generic."
          value={scores.specificity}
          reduceMotion={!!reduceMotion}
        />
        <SubBar
          label="Guidance"
          tooltip="Whether you've set constraints and an output format."
          value={scores.guidance}
          reduceMotion={!!reduceMotion}
        />
        <SubBar
          label="Reusability"
          tooltip="Whether the prompt has variables and few-shot examples — the levers for running it again with new inputs."
          value={scores.reusability}
          reduceMotion={!!reduceMotion}
        />
      </div>

      {/* What to improve */}
      {suggestions.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
          <p className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-medium">
            What to improve
          </p>
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li key={s.id} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500/80 shrink-0"
                />
                <p className="flex-1 text-[13px] leading-relaxed text-foreground/85">
                  {s.text}
                </p>
                {onActionClick && (
                  <button
                    type="button"
                    onClick={() => onActionClick(s.target)}
                    className="shrink-0 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline underline-offset-4"
                  >
                    {s.cta}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length === 0 && scores.overall >= 80 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-[13px] text-foreground/85 leading-relaxed">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Looks good.
            </span>{" "}
            All five blocks are pulling weight, with constraints, an output
            shape, variables, and at least one example. Test it with real
            inputs and ship it.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────
interface BarProps {
  value: number; // 0-100
  height?: number;
  accent?: boolean;
  reduceMotion: boolean;
  thinking?: boolean;
}

function Bar({ value, height = 6, accent = false, reduceMotion, thinking }: BarProps) {
  const colorClass = accent
    ? scoreFillClass(value)
    : "bg-foreground/70 dark:bg-foreground/80";

  return (
    <div
      className="w-full overflow-hidden rounded-full bg-foreground/10"
      style={{ height: `${height}px` }}
    >
      <motion.div
        className={`h-full rounded-full ${colorClass}`}
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 110, damping: 22 }
        }
        // Subtle pulse while the AI is generating
        style={
          thinking && value > 0
            ? { animation: "pulse 1.6s ease-in-out infinite" }
            : undefined
        }
      />
    </div>
  );
}

function SubBar({
  label,
  tooltip,
  value,
  reduceMotion,
}: {
  label: string;
  tooltip: string;
  value: number;
  reduceMotion: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr_auto] items-center gap-3" title={tooltip}>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <Bar value={value} reduceMotion={reduceMotion} />
      <p className="font-mono text-[11px] text-muted-foreground tabular-nums w-9 text-right">
        {value}
      </p>
    </div>
  );
}

// ─── Score → colour mapping ───────────────────────────────────────
function scoreColorClass(v: number): string {
  if (v < 35) return "text-rose-500 dark:text-rose-400";
  if (v < 60) return "text-amber-500 dark:text-amber-400";
  if (v < 80) return "text-foreground";
  return "text-emerald-600 dark:text-emerald-400";
}

function scoreFillClass(v: number): string {
  if (v < 35) return "bg-rose-500/80";
  if (v < 60) return "bg-amber-500/85";
  if (v < 80) return "bg-primary";
  return "bg-emerald-500/85";
}
