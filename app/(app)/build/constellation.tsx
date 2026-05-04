"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────
export type BlockKey = "role" | "context" | "task" | "constraints" | "output_format";

export interface ConstellationData {
  role: string;
  context: string;
  task: string;
  constraints: string;
  output_format: string;
}

interface ConstellationProps {
  data: ConstellationData;
  thinking?: boolean;
  onNodeClick?: (key: BlockKey) => void;
}

// ─── Layout ───────────────────────────────────────────────────────
// Fixed node positions on a 600×380 viewBox. Task sits at the centre
// because every other block exists to inform what it should do.
const VIEW_W = 600;
const VIEW_H = 380;

// Asymmetric positions modelled on real constellations — no two spokes are
// collinear through the hub, so the shape reads as four distinct rays plus
// two perimeter arcs instead of a big "X" through the middle.
const NODES: Record<BlockKey, { x: number; y: number; label: string; isHub?: boolean }> = {
  role:          { x: 215, y: 105, label: "Role" },
  constraints:   { x: 455, y:  72, label: "Constraints" },
  task:          { x: 305, y: 205, label: "Task", isHub: true },
  context:       { x: 120, y: 268, label: "Context" },
  output_format: { x: 490, y: 305, label: "Output" },
};

// Two kinds of edges:
//   spoke — straight line from the Task hub to an outer block
//   arc   — curved line along the outer rim, bowing AWAY from Task so it
//           doesn't intersect the spokes. Gives the figure the shape of a
//           star map rather than a sun-burst.
type Edge =
  | { kind: "spoke"; a: BlockKey; b: BlockKey }
  | { kind: "arc"; a: BlockKey; b: BlockKey; bow: number };

const EDGES: Edge[] = [
  { kind: "spoke", a: "task", b: "role" },
  { kind: "spoke", a: "task", b: "context" },
  { kind: "spoke", a: "task", b: "constraints" },
  { kind: "spoke", a: "task", b: "output_format" },
  // Perimeter arcs: top one bows up, bottom one bows down.
  { kind: "arc", a: "role", b: "constraints", bow: -55 },
  { kind: "arc", a: "context", b: "output_format", bow: 55 },
];

// ─── Helpers ──────────────────────────────────────────────────────
function isFilled(s: string): boolean {
  return s.trim().length > 0;
}

/** Star size scales gently with how much content the user wrote in a block. */
function starRadius(content: string, isHub: boolean): number {
  if (!isFilled(content)) return 4;
  const base = isHub ? 11 : 8;
  const bonus = Math.min(content.trim().length / 60, 4);
  return base + bonus;
}

/** Detect {{variable_name}} placeholders, in first-seen order, deduped. */
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
  return out.slice(0, 5); // cap visible satellites
}

/** Cheap deterministic hash of a string for seeding the background field. */
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

interface BgStar {
  x: number;
  y: number;
  r: number;
  o: number;
}

/**
 * Each prompt's background star field is seeded by a hash of the content,
 * so the same prompt always produces the same speckle pattern but two
 * different prompts get two visually distinct fingerprints.
 */
function backgroundField(seed: number): BgStar[] {
  const rand = seededRandom(seed);
  const stars: BgStar[] = [];
  // Fewer, fainter dots — they should suggest a star field, not crowd it.
  for (let i = 0; i < 22; i++) {
    // Bias toward the edges so the centre stays clean for the constellation.
    const edgeBias = Math.pow(rand(), 0.6);
    const angle = rand() * Math.PI * 2;
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    const radius = edgeBias * Math.min(VIEW_W, VIEW_H) * 0.55;
    stars.push({
      x: cx + Math.cos(angle) * radius + (rand() - 0.5) * 60,
      y: cy + Math.sin(angle) * radius + (rand() - 0.5) * 40,
      r: 0.35 + rand() * 0.9,
      o: 0.08 + rand() * 0.18,
    });
  }
  return stars;
}

// ─── Component ────────────────────────────────────────────────────
export function Constellation({ data, thinking, onNodeClick }: ConstellationProps) {
  const reduceMotion = useReducedMotion();

  const fingerprint = useMemo(() => {
    const concat = data.role + data.context + data.task + data.constraints + data.output_format;
    return concat.length === 0 ? 1 : hash(concat);
  }, [data]);

  const bgStars = useMemo(() => backgroundField(fingerprint), [fingerprint]);

  const fillState = useMemo(
    () => ({
      role: isFilled(data.role),
      context: isFilled(data.context),
      task: isFilled(data.task),
      constraints: isFilled(data.constraints),
      output_format: isFilled(data.output_format),
    }),
    [data]
  );

  const filledCount = Object.values(fillState).filter(Boolean).length;

  return (
    <div className="relative w-full max-w-[640px] mx-auto select-none">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto text-foreground"
        role="img"
        aria-label={
          filledCount === 0
            ? "An empty prompt constellation, waiting to be built."
            : `Prompt constellation with ${filledCount} of 5 blocks filled.`
        }
      >
        {/* Glow filter — tight halo, more "starlight" than "blob" */}
        <defs>
          <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="hub-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
          </radialGradient>
        </defs>

        {/* Background star field — content-seeded fingerprint */}
        <g aria-hidden="true">
          {bgStars.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="currentColor"
              opacity={s.o}
            />
          ))}
        </g>

        {/* Edges — straight spokes from Task, curved arcs around the rim */}
        <g aria-hidden="true">
          {EDGES.map((edge) => {
            const both = fillState[edge.a] && fillState[edge.b];
            const A = NODES[edge.a];
            const B = NODES[edge.b];

            if (edge.kind === "spoke") {
              return (
                <motion.line
                  key={`${edge.a}-${edge.b}`}
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeLinecap="round"
                  initial={false}
                  animate={{
                    opacity: both ? 0.4 : 0,
                    pathLength: both ? 1 : 0,
                  }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.7, ease: "easeOut" }
                  }
                />
              );
            }

            // Quadratic Bezier whose control point is offset perpendicular to
            // the chord so the arc bows away from the hub.
            const mx = (A.x + B.x) / 2;
            const my = (A.y + B.y) / 2;
            const cy = my + edge.bow;
            const d = `M ${A.x} ${A.y} Q ${mx} ${cy} ${B.x} ${B.y}`;

            return (
              <motion.path
                key={`${edge.a}-${edge.b}`}
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.9}
                strokeLinecap="round"
                initial={false}
                animate={{
                  opacity: both ? 0.32 : 0,
                  pathLength: both ? 1 : 0,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.9, ease: "easeOut" }
                }
              />
            );
          })}
        </g>

        {/* Nodes (stars + satellites + labels) */}
        {(Object.keys(NODES) as BlockKey[]).map((key) => {
          const n = NODES[key];
          const filled = fillState[key];
          const r = starRadius(data[key], !!n.isHub);
          const variables = detectVariables(data[key]);

          return (
            <Node
              key={key}
              nodeKey={key}
              x={n.x}
              y={n.y}
              label={n.label}
              isHub={!!n.isHub}
              filled={filled}
              radius={r}
              variables={variables}
              thinking={thinking ?? false}
              reduceMotion={!!reduceMotion}
              onClick={onNodeClick ? () => onNodeClick(key) : undefined}
            />
          );
        })}
      </svg>

      {/* Caption — shows progress without crowding the figure */}
      <p className="mt-3 text-center text-[11px] tracking-[0.18em] uppercase text-muted-foreground tabular-nums">
        {filledCount === 0
          ? "Awaiting the first star"
          : filledCount === 5
          ? "Constellation complete"
          : `${filledCount} / 5 stars`}
      </p>
    </div>
  );
}

// ─── Node ─────────────────────────────────────────────────────────
interface NodeProps {
  nodeKey: BlockKey;
  x: number;
  y: number;
  label: string;
  isHub: boolean;
  filled: boolean;
  radius: number;
  variables: string[];
  thinking: boolean;
  reduceMotion: boolean;
  onClick?: () => void;
}

function Node({
  x,
  y,
  label,
  isHub,
  filled,
  radius,
  variables,
  thinking,
  reduceMotion,
  onClick,
}: NodeProps) {
  // Slow "breathing" pulse for filled stars — almost imperceptible but
  // makes the constellation feel alive. Disabled when reduce-motion is on.
  const breathe = reduceMotion
    ? {}
    : {
        animate: {
          scale: filled ? [1, 1.06, 1] : 1,
          opacity: filled ? [0.95, 1, 0.95] : 0.35,
        },
        transition: filled
          ? {
              duration: thinking ? 1.4 : 4.5,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }
          : { duration: 0.5 },
      };

  const labelY = y + radius + 18;

  return (
    <g
      onClick={onClick}
      className={onClick ? "cursor-pointer" : undefined}
      style={{ pointerEvents: onClick ? "auto" : "none" }}
    >
      {/* Invisible larger hit target for hover/click on small empty nodes */}
      {onClick && (
        <circle cx={x} cy={y} r={Math.max(radius + 14, 18)} fill="transparent" pointerEvents="all">
          <title>{label}</title>
        </circle>
      )}

      {/* Halo — tighter, more starlight than blob */}
      {filled && (
        <motion.circle
          cx={x}
          cy={y}
          r={radius + 3.5}
          fill="currentColor"
          className="text-primary"
          opacity={0.22}
          filter="url(#star-glow)"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 0.22, scale: 1 }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }
          }
        />
      )}

      {/* The star itself */}
      <motion.circle
        cx={x}
        cy={y}
        fill={filled ? (isHub ? "url(#hub-gradient)" : "currentColor") : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1}
        initial={false}
        animate={{
          r: radius,
          opacity: filled ? 1 : 0.35,
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 220, damping: 18 }
        }
        {...breathe}
      />

      {/* Inner cross-hair on the hub for a touch of cartographic flavour */}
      {isHub && filled && (
        <motion.g
          stroke="currentColor"
          strokeWidth={0.8}
          opacity={0.55}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <line x1={x - radius - 6} y1={y} x2={x - radius - 2} y2={y} />
          <line x1={x + radius + 2} y1={y} x2={x + radius + 6} y2={y} />
          <line x1={x} y1={y - radius - 6} x2={x} y2={y - radius - 2} />
          <line x1={x} y1={y + radius + 2} x2={x} y2={y + radius + 6} />
        </motion.g>
      )}

      {/* Variable satellites — small dots arranged in an arc above the parent */}
      {variables.map((_v, i) => {
        // Spread the satellites across the top half, ~24px from the parent.
        const total = variables.length;
        const angleSpan = Math.min(total - 1, 4) * 22; // total degrees of arc
        const startDeg = -90 - angleSpan / 2;
        const stepDeg = total > 1 ? angleSpan / (total - 1) : 0;
        const deg = startDeg + i * stepDeg;
        const rad = (deg * Math.PI) / 180;
        const dist = radius + 14;
        const sx = x + Math.cos(rad) * dist;
        const sy = y + Math.sin(rad) * dist;
        return (
          <motion.circle
            key={i}
            cx={sx}
            cy={sy}
            r={1.8}
            fill="currentColor"
            className="text-primary"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.85, scale: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { delay: 0.2 + i * 0.06, duration: 0.4 }
            }
          />
        );
      })}

      {/* Label */}
      <text
        x={x}
        y={labelY}
        textAnchor="middle"
        fontFamily="var(--font-serif, Georgia, serif)"
        fontSize={isHub ? 13 : 12}
        fontStyle="italic"
        fill="currentColor"
        opacity={filled ? 0.85 : 0.4}
        style={{ transition: "opacity 0.4s ease" }}
      >
        {label}
      </text>
    </g>
  );
}
