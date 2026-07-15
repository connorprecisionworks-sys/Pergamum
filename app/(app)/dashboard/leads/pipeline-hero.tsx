interface PipelineHeroProps {
  qualifyingLeads: number;
  dealValue: number | null;
}

function formatMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `$${Math.round(value).toLocaleString()}`;
  return `$${Math.round(value)}`;
}

export function PipelineHero({ qualifyingLeads, dealValue }: PipelineHeroProps) {
  if (dealValue === null) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Set a deal value in Alert settings below to see your potential pipeline.
        </p>
      </div>
    );
  }

  const potential = qualifyingLeads * dealValue;

  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.08em] text-foreground-subtle">Potential pipeline</p>
      <p className="mt-2 font-mono text-5xl font-medium tabular-nums text-foreground sm:text-6xl">
        {formatMoney(potential)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {qualifyingLeads.toLocaleString()} hot lead{qualifyingLeads === 1 ? "" : "s"} &times;{" "}
        {formatMoney(dealValue)} deal value
      </p>
    </div>
  );
}
