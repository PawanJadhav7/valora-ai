"use client";

type Props = {
  inflow: number;
  outflow: number;
  net: number;
};

export function FinanceBars({ inflow, outflow, net }: Props) {
  const max = Math.max(inflow, outflow, Math.abs(net), 1);

  const bar = (value: number) => `${(Math.abs(value) / max) * 100}%`;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="text-sm font-semibold text-foreground">Cash Flow</div>

      <Bar label="Inflow" width={bar(inflow)} color="bg-emerald-400" />
      <Bar label="Outflow" width={bar(outflow)} color="bg-rose-400" />
      <Bar label="Net" width={bar(net)} color="bg-cyan-400" />
    </div>
  );
}

function Bar({
  label,
  width,
  color,
}: {
  label: string;
  width: string;
  color: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="h-2 rounded-full bg-muted">
        <div className={`h-2 rounded-full ${color}`} style={{ width }} />
      </div>
    </div>
  );
}