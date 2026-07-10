"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────
export type BlockKey = "role" | "context" | "task" | "constraints" | "output_format";

export interface TypeCaseData {
  role: string;
  context: string;
  task: string;
  constraints: string;
  output_format: string;
}

interface TypeCaseProps {
  data: TypeCaseData;
  thinking?: boolean;
  onCompartmentClick?: (key: BlockKey) => void;
}

// ─── Layout ───────────────────────────────────────────────────────
// A printer's type case stylised down to the five blocks Prmpt cares
// about. Top row: three small compartments for the shorter blocks. Bottom
// row: two larger compartments for Context (usually the longest) and
// Output. Each filled block "sets" metal slugs into its compartment.

const VIEW_W = 600;
const VIEW_H = 380;
const TRAY_H = 346;

interface Compartment {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  slugBudget: number;
}

const COMPARTMENTS: Record<BlockKey, Compartment> = {
  role:          { x: 14,  y: 14,  w: 180, h: 110, label: "ROLE",          slugBudget: 4 },
  task:          { x: 210, y: 14,  w: 180, h: 110, label: "TASK",          slugBudget: 4 },
  constraints:   { x: 406, y: 14,  w: 180, h: 110, label: "CONSTRAINTS",   slugBudget: 5 },
  context:       { x: 14,  y: 140, w: 288, h: 170, label: "CONTEXT",       slugBudget: 8 },
  output_format: { x: 318, y: 140, w: 268, h: 170, label: "OUTPUT FORMAT", slugBudget: 5 },
};

const BLOCK_ORDER: BlockKey[] = ["role", "task", "constraints", "context", "output_format"];

// ─── Helpers ──────────────────────────────────────────────────────
function isFilled(s: string): boolean {
  return s.trim().length > 0;
}

/** Cheap deterministic hash so the same content always produces the same slug pattern. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = ((h ^ str.charCodeAt(i)) * 16777619) >>> 0;
  }
  return h;
}

function seededRandom(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

interface Slug {
  width: number;   // ratio 0..1 of inner width
  offset: number;  // ratio 0..1 of inner width — left padding to suggest justified type
}

/**
 * Convert a block's content into a deterministic stack of "slugs". Each slug
 * represents a line of metal type. Width and indentation are seeded by the
 * content, so each prompt has a unique typeset signature.
 */
function generateSlugs(content: string, budget: number): Slug[] {
  if (!isFilled(content)) return [];
  const trimmed = content.trim();
  const slugCount = Math.min(budget, Math.max(1, Math.ceil(trimmed.length / 35)));
  const rand = seededRandom(hash(trimmed));
  return Array.from({ length: slugCount }, () => ({
    width: 0.58 + rand() * 0.38, // 58%–96% of compartment inner width
    offset: rand() * 0.04,
  }));
}

/** Detect {{variable_name}} placeholders, in first-seen order, deduped, capped. */
function detectVariables(content: string): string[] {
  if (!content) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of content.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out.slice(0, 3);
}

// ─── Component ────────────────────────────────────────────────────
export function TypeCase({ data, thinking, onCompartmentClick }: TypeCaseProps) {
  const reduceMotion = useReducedMotion();

  const filledCount = useMemo(
    () => BLOCK_ORDER.filter((k) => isFilled(data[k])).length,
    [data]
  );

  // Theme palette is exposed via CSS custom properties on the wrapper. The
  // light values are the defaults; the `dark:` overrides take effect when an
  // ancestor (the <html> element via next-themes) carries the `dark` class.
  const themeVars =
    "[--tc-tray-light:#efe4cb] [--tc-tray-dark:#d9c89e] [--tc-tray-edge:#8a6f3f] " +
    "[--tc-recess-dark:#b89a64] [--tc-recess-light:#d2b986] [--tc-grain:#6b4d22] " +
    "[--tc-slug-top:#4a3a2a] [--tc-slug-mid:#2a2018] [--tc-slug-bottom:#1a120c] " +
    "[--tc-label-text:#2a1d0a] " +
    "dark:[--tc-tray-light:#3a2716] dark:[--tc-tray-dark:#261707] dark:[--tc-tray-edge:#5a4326] " +
    "dark:[--tc-recess-dark:#1c1006] dark:[--tc-recess-light:#2c1d0c] dark:[--tc-grain:#8a6e3a] " +
    "dark:[--tc-slug-top:#d4c5a3] dark:[--tc-slug-mid:#b09e7a] dark:[--tc-slug-bottom:#8a7654] " +
    "dark:[--tc-label-text:#1a1208]";

  return (
    <div className={`relative w-full max-w-[640px] mx-auto select-none ${themeVars}`}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
        aria-label={
          filledCount === 0
            ? "An empty type case, waiting for type to be set."
            : `Type case with ${filledCount} of 5 blocks set.`
        }
      >
        <defs>
          {/* Tray gradient — warm parchment in light mode, deep walnut in dark */}
          <linearGradient id="tc-tray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tc-tray-light, #efe4cb)" />
            <stop offset="100%" stopColor="var(--tc-tray-dark, #d9c89e)" />
          </linearGradient>
          <linearGradient id="tc-recess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tc-recess-dark, #b89a64)" />
            <stop offset="100%" stopColor="var(--tc-recess-light, #d2b986)" />
          </linearGradient>
          <linearGradient id="tc-brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4af6d" />
            <stop offset="50%" stopColor="#b08a4d" />
            <stop offset="100%" stopColor="#946c30" />
          </linearGradient>
          <linearGradient id="tc-brass-dim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a08560" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#7d6440" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="tc-slug" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tc-slug-top, #4a3a2a)" />
            <stop offset="40%" stopColor="var(--tc-slug-mid, #2a2018)" />
            <stop offset="100%" stopColor="var(--tc-slug-bottom, #1a120c)" />
          </linearGradient>
          {/* Subtle inner shadow for the recessed compartment look */}
          <filter id="tc-inset" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
            <feOffset dy="1" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="inner" />
            <feFlood floodColor="#000" floodOpacity="0.35" />
            <feComposite in2="inner" operator="in" />
            <feComposite in="SourceGraphic" />
          </filter>
        </defs>

        {/* The wooden tray */}
        <rect
          x="0"
          y="0"
          width={VIEW_W}
          height={TRAY_H}
          rx="10"
          fill="url(#tc-tray)"
          stroke="var(--tc-tray-edge, #8a6f3f)"
          strokeWidth="1.2"
          strokeOpacity="0.55"
        />

        {/* Subtle horizontal grain lines on the tray */}
        <g aria-hidden="true" opacity="0.08">
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={(TRAY_H / 8) * i + 4}
              x2={VIEW_W}
              y2={(TRAY_H / 8) * i + 4}
              stroke="var(--tc-grain, #6b4d22)"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Compartments */}
        {BLOCK_ORDER.map((key) => (
          <CompartmentNode
            key={key}
            blockKey={key}
            compartment={COMPARTMENTS[key]}
            content={data[key]}
            filled={isFilled(data[key])}
            thinking={thinking ?? false}
            reduceMotion={!!reduceMotion}
            onClick={onCompartmentClick ? () => onCompartmentClick(key) : undefined}
          />
        ))}
      </svg>

      <p className="mt-3 text-center text-[11px] tracking-[0.18em] uppercase text-muted-foreground tabular-nums">
        {filledCount === 0
          ? "Type case empty"
          : filledCount === 5
          ? "Tray complete"
          : `${filledCount} / 5 set`}
      </p>
    </div>
  );
}

// ─── Compartment ──────────────────────────────────────────────────
interface CompartmentNodeProps {
  blockKey: BlockKey;
  compartment: Compartment;
  content: string;
  filled: boolean;
  thinking: boolean;
  reduceMotion: boolean;
  onClick?: () => void;
}

function CompartmentNode({
  compartment,
  content,
  filled,
  thinking,
  reduceMotion,
  onClick,
}: CompartmentNodeProps) {
  const { x, y, w, h, label, slugBudget } = compartment;

  const slugs = useMemo(
    () => generateSlugs(content, slugBudget),
    [content, slugBudget]
  );
  const variables = useMemo(() => detectVariables(content), [content]);

  // Inner padding inside the compartment.
  const innerPad = 12;
  const innerX = x + innerPad;
  const innerY = y + innerPad;
  const innerW = w - innerPad * 2;
  const innerH = h - innerPad * 2;

  // Brass label at top-centre.
  const labelW = Math.min(96, innerW - 16);
  const labelH = 16;
  const labelX = x + (w - labelW) / 2;
  const labelY = y + 8;

  // Slugs stack from the bottom up.
  const slugH = 6;
  const slugGap = 3;

  return (
    <g
      onClick={onClick}
      className={onClick ? "cursor-pointer" : undefined}
      style={{ pointerEvents: onClick ? "auto" : "none" }}
    >
      {/* Compartment recess */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="5"
        fill="url(#tc-recess)"
        stroke="var(--tc-tray-edge, #8a6f3f)"
        strokeWidth="0.8"
        strokeOpacity="0.4"
        filter="url(#tc-inset)"
      />

      {/* Variable ornaments — small fleurons along the top edge */}
      {variables.map((_v, i) => (
        <motion.text
          key={i}
          x={innerX + 4 + i * 12}
          y={innerY + 6}
          fontFamily="Georgia, serif"
          fontSize={10}
          fill="var(--tc-label-text, #2a1d0a)"
          opacity={0.55}
          textAnchor="start"
          initial={reduceMotion ? false : { opacity: 0, y: innerY }}
          animate={{ opacity: 0.55, y: innerY + 6 }}
          transition={
            reduceMotion ? { duration: 0 } : { delay: 0.2 + i * 0.05, duration: 0.4 }
          }
        >
          ✻
        </motion.text>
      ))}

      {/* Brass nameplate */}
      <g>
        <rect
          x={labelX}
          y={labelY}
          width={labelW}
          height={labelH}
          rx="2"
          fill={filled ? "url(#tc-brass)" : "url(#tc-brass-dim)"}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.6"
        />
        {/* Highlight strip across the top of the brass */}
        {filled && (
          <line
            x1={labelX + 2}
            y1={labelY + 1.5}
            x2={labelX + labelW - 2}
            y2={labelY + 1.5}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="0.8"
          />
        )}
        <text
          x={x + w / 2}
          y={labelY + labelH / 2 + 3.4}
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={9}
          fontWeight={600}
          letterSpacing="1.2"
          fill="var(--tc-label-text, #2a1d0a)"
          opacity={filled ? 1 : 0.55}
          style={{ transition: "opacity 0.4s ease" }}
        >
          {label}
        </text>
      </g>

      {/* Metal type slugs — stacked from the bottom of the compartment */}
      <g>
        {slugs.map((s, i) => {
          const slugWidth = innerW * s.width;
          const slugX = innerX + innerW * s.offset;
          const slugY = y + h - innerPad - (i + 1) * slugH - i * slugGap;
          return (
            <motion.g
              key={i}
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: slugY + 14 }
              }
              animate={{ opacity: 1, y: slugY }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      delay: 0.05 + i * 0.06,
                      type: "spring",
                      stiffness: 180,
                      damping: 18,
                    }
              }
            >
              {/* Slug body */}
              <rect
                x={slugX}
                y={0}
                width={slugWidth}
                height={slugH}
                rx="1.2"
                fill="url(#tc-slug)"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="0.3"
              />
              {/* Subtle highlight catching the light at the top edge of the slug */}
              <line
                x1={slugX + 1}
                y1={1}
                x2={slugX + slugWidth - 1}
                y2={1}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="0.5"
              />
            </motion.g>
          );
        })}
      </g>

      {/* "Thinking" pulse — a faint glow on the compartment edge while the AI works */}
      {thinking && filled && !reduceMotion && (
        <motion.rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx="5"
          fill="none"
          stroke="var(--tc-tray-edge, #8a6f3f)"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Invisible hit target — covers the whole compartment for easier clicking */}
      {onClick && (
        <rect x={x} y={y} width={w} height={h} fill="transparent" pointerEvents="all">
          <title>{label}</title>
        </rect>
      )}
    </g>
  );
}
