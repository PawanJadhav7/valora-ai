"use client";

import * as React from "react";
import { money } from "@/lib/format";
import { FinanceExposureSkeleton } from "@/components/finance/FinanceExposureSkeleton";
import { FinanceExposureChart, type ExposureRow } from "@/components/finance/FinanceExposureChart";

type Api = {
  kpis: any | null;
  topCounterparties: Array<{
    counterparty: string;
    inflow: number | string;
    outflow: number | string;
    net: number | string;
    txn_count: number | string;
  }>;
};

export default function FinanceExposurePage() {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [kpis, setKpis] = React.useState<any | null>(null);
  const [rows, setRows] = React.useState<ExposureRow[]>([]);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/finance/exposure", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as Api;

        const norm = (json.topCounterparties ?? []).map((r) => ({
          counterparty: String(r.counterparty ?? "Unknown"),
          inflow: Number(r.inflow ?? 0),
          outflow: Number(r.outflow ?? 0),
          net: Number(r.net ?? 0),
          txn_count: Number(r.txn_count ?? 0),
        }));

        setKpis(json.kpis);
        setRows(norm);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load exposure");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  if (loading) return <FinanceExposureSkeleton />;

  if (err) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Exposure</div>
        <div className="mt-2 text-sm text-danger">{err}</div>
      </div>
    );
  }

  const totalOut = Number(kpis?.total_outflow_30d ?? 0);
  const topOut = Number(kpis?.top_outflow_amount ?? 0);
  const topOutPct = kpis?.top_outflow_share_pct == null ? null : Number(kpis.top_outflow_share_pct);
  const hhi = kpis?.hhi_outflow == null ? null : Number(kpis.hhi_outflow);

  const sev =
    topOutPct == null ? "—" : topOutPct >= 40 ? "High" : topOutPct >= 25 ? "Moderate" : "Low";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Exposure</h1>
        <p className="text-sm text-muted-foreground">
          Concentration risk across counterparties (last 30 days).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Top outflow counterparty</div>
          <div className="mt-1 text-base font-semibold text-foreground">
            {kpis?.top_outflow_counterparty ?? "—"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {money(topOut)} {topOutPct != null ? `(${topOutPct.toFixed(2)}%)` : ""}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total outflow (30d)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(totalOut)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Concentration: {sev}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">HHI (outflow)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {hhi == null ? "—" : hhi.toFixed(3)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Higher = more concentrated
          </div>
        </div>
      </div>

      <FinanceExposureChart rows={rows} />

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground mb-2">Top counterparties (outflow)</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3">Counterparty</th>
                <th className="text-right py-2 px-3">Outflow</th>
                <th className="text-right py-2 px-3">Inflow</th>
                <th className="text-right py-2 pl-3">Txns</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r) => (
                <tr key={r.counterparty} className="border-b border-border/60">
                  <td className="py-2 pr-3 text-foreground">{r.counterparty}</td>
                  <td className="py-2 px-3 text-right text-foreground">{money(r.outflow)}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{money(r.inflow)}</td>
                  <td className="py-2 pl-3 text-right text-muted-foreground">{r.txn_count}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={4}>
                    No counterparty data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}