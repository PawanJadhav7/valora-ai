"use client";

type Props = {
  inflow: number;
  outflow: number;
  net: number;
};

const money = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export function FinanceKpiTiles({ inflow, outflow, net }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Kpi label="Inflow" value={money(inflow)} />
      <Kpi label="Outflow" value={money(outflow)} />
      <Kpi label="Net Cash Flow" value={money(net)} />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}