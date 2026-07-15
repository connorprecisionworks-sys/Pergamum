interface FunnelStats {
  reached: number;
  used: number;
  hot: number;
  clicked: number;
  booked: number;
}

const STAGES: { key: keyof FunnelStats; label: string }[] = [
  { key: "reached", label: "Reached" },
  { key: "used", label: "Used a prompt" },
  { key: "hot", label: "Went hot" },
  { key: "clicked", label: "Clicked offer" },
  { key: "booked", label: "Booked" },
];

export function ConversionFunnel({ stats }: { stats: FunnelStats }) {
  const max = Math.max(stats.reached, 1);

  return (
    <div className="space-y-2.5">
      {STAGES.map((stage) => (
        <div key={stage.key} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-foreground">{stage.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-inset">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((stats[stage.key] / max) * 100, stats[stage.key] > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-foreground-muted">
            {stats[stage.key].toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
