interface PromptPerformanceRow {
  prompt_id: string;
  title: string;
  lead_count: number;
}

export function PromptPerformance({ rows }: { rows: PromptPerformanceRow[] }) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.lead_count), 1);

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.prompt_id} className="flex items-center gap-3">
          <span className="w-[40%] shrink-0 truncate text-sm text-foreground">{row.title}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-inset">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((row.lead_count / max) * 100, 4)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-foreground-muted">
            {row.lead_count}
          </span>
        </div>
      ))}
    </div>
  );
}
