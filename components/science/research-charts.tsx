"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Brand violet (matches --primary at hsl(263 70% 50%) in light, hsl(263 75% 65%) in dark).
// Recharts can't read CSS vars directly, so we use mid-tone fixed colors that work in both modes.
const VIOLET = "hsl(263, 70%, 55%)";
// Neutral grays that read on both cream and near-black backgrounds.
const NEUTRAL_BAR = "hsl(0, 0%, 70%)";
const AXIS_TEXT   = "hsl(0, 0%, 55%)";
const GRID        = "hsl(0, 0%, 55% / 0.18)";

interface ChartProps {
  data: { label: string; value: number }[];
  unit?: string;
}

// ── Theme-aware tooltip — uses Tailwind classes so it auto-adapts to light/dark.
function CustomTooltip({
  active,
  payload,
  label,
  unit = "%",
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-mono font-medium text-foreground tabular-nums">
        {payload[0].value}
        {unit}
      </p>
    </div>
  );
}

function SimpleBarChart({ data, unit = "%" }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: AXIS_TEXT }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${v}${unit}`}
          tick={{ fontSize: 11, fill: AXIS_TEXT }}
          axisLine={false}
          tickLine={false}
          domain={[0, "auto"]}
        />
        <Tooltip
          content={<CustomTooltip unit={unit} />}
          // Cursor is the hover-highlight rectangle behind the bar — keep it subtle and theme-neutral.
          cursor={{ fill: "hsl(263, 70%, 55% / 0.10)" }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={64}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? VIOLET : NEUTRAL_BAR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChainOfThoughtChart() {
  return (
    <SimpleBarChart
      data={[
        { label: "Standard", value: 17.9 },
        { label: "Chain-of-thought", value: 56.9 },
      ]}
    />
  );
}

export function FewShotChart() {
  return (
    <SimpleBarChart
      data={[
        { label: "Zero-shot", value: 64.3 },
        { label: "One-shot", value: 68.0 },
        { label: "Few-shot (64)", value: 71.2 },
      ]}
    />
  );
}

export function TreeOfThoughtsChart() {
  return (
    <SimpleBarChart
      data={[
        { label: "Standard", value: 7.3 },
        { label: "Chain-of-thought", value: 4.0 },
        { label: "Tree of Thoughts", value: 74.0 },
      ]}
    />
  );
}

export function XmlFormatChart() {
  return (
    <SimpleBarChart
      data={[
        { label: "Plain text", value: 100 },
        { label: "XML tags", value: 117.5 },
      ]}
      unit=""
    />
  );
}

export function SelfConsistencyChart() {
  return (
    <SimpleBarChart
      data={[
        { label: "CoT alone", value: 56.9 },
        { label: "CoT + self-consistency", value: 74.4 },
      ]}
    />
  );
}
