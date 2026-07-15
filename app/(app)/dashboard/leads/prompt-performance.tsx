interface PromptPerformanceRow {
  prompt_id: string;
  title: string;
  lead_count: number;
  hot_count: number;
  offer_click_count: number;
}

// Buyer score drives the bar: hot leads weigh more than raw offer clicks,
// matching the RPC's own ORDER BY (hot_count desc, offer_click_count desc).
function buyerScore(row: PromptPerformanceRow): number {
  return row.hot_count * 2 + row.offer_click_count;
}

export function PromptPerformance({ rows }: { rows: PromptPerformanceRow[] }) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map(buyerScore), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.prompt_id} className="flex items-center gap-3">
          <span className="w-[40%] shrink-0 truncate text-sm text-foreground">{row.title}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-inset">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((buyerScore(row) / max) * 100, buyerScore(row) > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="w-24 shrink-0 text-right font-mono text-xs tabular-nums text-foreground-muted">
            {row.hot_count} hot &middot; {row.offer_click_count} clicks
          </span>
        </div>
      ))}
    </div>
  );
}
