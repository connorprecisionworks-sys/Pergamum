interface LeadStats {
  total_leads: number;
  hot_leads: number;
  offer_clicks: number;
  new_this_week: number;
}

const TILES: { key: keyof LeadStats; label: string }[] = [
  { key: "total_leads", label: "Total leads" },
  { key: "hot_leads", label: "Hot leads" },
  { key: "offer_clicks", label: "Offer clicks" },
  { key: "new_this_week", label: "New this week" },
];

export function LeadKpiRow({ stats }: { stats: LeadStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TILES.map((tile) => (
        <div key={tile.key} className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-foreground-subtle">{tile.label}</p>
          <p className="mt-1.5 font-mono text-2xl font-medium tabular-nums text-foreground">
            {stats[tile.key].toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
