"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface EngagementChartProps {
  data: { day: string; copies: number; clicks: number; directed: number }[];
}

// Recharts can't read CSS vars directly (they resolve per-theme, not at
// render time), so — same workaround as components/science/research-charts —
// fixed mid-tone neutrals that read against both the white and near-black
// card background instead of true black/white. Series are distinguished by
// opacity of the same ink hue, matching the monochrome design system.
const AXIS_TEXT = "hsl(240, 4%, 58%)";

const SERIES: { key: "copies" | "clicks" | "directed"; label: string; color: string }[] = [
  { key: "copies", label: "Prompts copied", color: "hsl(240, 6%, 20%)" },
  { key: "clicks", label: "Offer clicks", color: "hsl(240, 6%, 45%)" },
  { key: "directed", label: "New leads directed in", color: "hsl(240, 6%, 70%)" },
];

function formatDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 text-foreground-subtle">{label ? formatDay(label) : ""}</p>
      {SERIES.map((s) => {
        const point = payload.find((p) => p.dataKey === s.key);
        if (!point) return null;
        return (
          <p key={s.key} className="flex items-center gap-1.5 font-mono tabular-nums text-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            {point.value} {s.label.toLowerCase()}
          </p>
        );
      })}
    </div>
  );
}

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`engagement-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.08} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey="day"
            tickFormatter={formatDay}
            tick={{ fontSize: 11, fill: AXIS_TEXT }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(240, 4%, 75%)", strokeWidth: 1 }} />
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stackId="engagement"
              stroke={s.color}
              strokeWidth={1.5}
              fill={`url(#engagement-fill-${s.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
