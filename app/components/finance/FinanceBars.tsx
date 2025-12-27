// components/finance/FinanceBars.tsx
import { money } from "@/lib/format";

type Props = {
  inflow: number;
  outflow: number;
  net: number;
};

export function FinanceBars({ inflow, outflow, net }: Props) {
  const max = Math.max(inflow, outflow, Math.abs(net), 1);

  const Bar = ({
    label,
    value,
    variant,
  }: {
    label: string;
    value: number;
    variant: "in" | "out" | "net";
  }) => {
    const wRaw = (Math.abs(value) / max) * 100;
    const w = value === 0 ? 0 : Math.max(2, Math.round(wRaw)); // 2% min if non-zero

    const color =
      variant === "in"
        ? "bg-success/80"
        : variant === "out"
        ? "bg-danger/80"
        : "bg-primary/80";

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="text-foreground">{money(value)}</span>
        </div>
        <div className="h-2 rounded-full bg-muted/40 ring-1 ring-border/60 overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${w}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground mb-3">
        30-day cash movement
      </div>

      <div className="space-y-3">
        <Bar label="Inflow" value={inflow} variant="in" />
        <Bar label="Outflow" value={outflow} variant="out" />
        <Bar label="Net cash flow" value={net} variant="net" />
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Real values from <code className="text-foreground">/api/kpis</code>.
      </div>
    </div>
  );
}