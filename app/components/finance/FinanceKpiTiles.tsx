// components/finance/FinanceKpiTiles.tsx
import { money } from "@/lib/format";

export function FinanceKpiTiles({
  inflow,
  outflow,
  net,
}: {
  inflow: number;
  outflow: number;
  net: number;
}) {
  const Tile = ({
    label,
    value,
    hint,
  }: {
    label: string;
    value: string;
    hint: string;
  }) => (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile label="Inflow" value={money(inflow)} hint="Last 30 days" />
      <Tile label="Outflow" value={money(outflow)} hint="Last 30 days" />
      <Tile label="Net cash flow" value={money(net)} hint="Last 30 days" />
    </div>
  );
}