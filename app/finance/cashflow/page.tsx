"use client";

import * as React from "react";
import { FinanceCashflowSkeleton } from "@/components/finance/FinanceCashflowSkeleton";
import { FinanceCashflowChart, type CashflowPoint } from "@/components/finance/FinanceCashflowChart";
import { money } from "@/lib/format";

type ApiResponse = {
  series: Array<{
    day: string;
    inflow: number | string;
    outflow: number | string;
    net: number | string;
  }>;
};

export default function FinanceCashflowPage() {
  const [series, setSeries] = React.useState<CashflowPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/finance/cashflow", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as ApiResponse;

        const normalized: CashflowPoint[] = (data.series ?? []).map((r: any) => {
        const inflow = Number(r.inflow);
        const outflow = Number(r.outflow);
        const net = Number(r.net);

        return {
          day: String(r.day).slice(0, 10),
          inflow: Number.isFinite(inflow) ? inflow : 0,
          outflow: Number.isFinite(outflow) ? outflow : 0,
          net: Number.isFinite(net) ? net : 0,
        };
      });

        setSeries(normalized);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load cashflow series");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  if (loading) return <FinanceCashflowSkeleton />;

  if (err) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Cash Flow</div>
        <div className="mt-2 text-sm text-danger">{err}</div>
      </div>
    );
  }
  if (!series.length) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">Cash Flow</div>
      <div className="mt-2 text-sm text-muted-foreground">No data for the last 30 days.</div>
    </div>
  );
}

  const inflow30 = series.reduce((s, d) => s + d.inflow, 0);
  const outflow30 = series.reduce((s, d) => s + d.outflow, 0);
  const net30 = series.reduce((s, d) => s + d.net, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Cash Flow</h1>
        <p className="text-sm text-muted-foreground">Daily inflow/outflow and net (last 30 days).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Inflow (30d)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(inflow30)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Outflow (30d)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(outflow30)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Net (30d)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(net30)}</div>
        </div>
      </div>

      <FinanceCashflowChart series={series} />
    </div>
  );
}