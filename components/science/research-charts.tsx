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

const VIOLET = "hsl(263, 70%, 50%)";
const MUTED  = "hsl(0, 0%, 40%)";

interface ChartProps {
  data: { label: string; value: number }[];
  unit?: string;
}

function SimpleBarChart({ data, unit = "%" }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,88%)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: MUTED }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${v}${unit}`}
          tick={{ fontSize: 11, fill: MUTED }}
          axisLine={false}
          tickLine={false}
          domain={[0, "auto"]}
        />
        <Tooltip
          formatter={(v) => [`${v}${unit}`, ""]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid hsl(40,10%,88%)",
            boxShadow: "none",
          }}
          cursor={{ fill: "hsl(40,18%,92%)" }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={64}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? VIOLET : "hsl(0,0%,80%)"} />
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
