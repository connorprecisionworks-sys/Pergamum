"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface EngagementChartProps {
  data: { day: string; count: number }[];
}

// Recharts can't read CSS vars directly (they resolve per-theme, not at
// render time), so — same workaround as components/science/research-charts —
// fixed mid-tone neutrals that read against both the white and near-black
// card background instead of true black/white.
const LINE = "hsl(240, 6%, 40%)";
const AXIS_TEXT = "hsl(240, 4%, 58%)";

function formatDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-0.5 text-foreground-subtle">{label ? formatDay(label) : ""}</p>
      <p className="font-mono font-medium tabular-nums text-foreground">
        {payload[0].value} event{payload[0].value === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="engagement-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE} stopOpacity={0.16} />
            <stop offset="100%" stopColor={LINE} stopOpacity={0} />
          </linearGradient>
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
        <Area type="monotone" dataKey="count" stroke={LINE} strokeWidth={2} fill="url(#engagement-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
