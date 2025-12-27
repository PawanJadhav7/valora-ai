"use client";

import * as React from "react";
import { money } from "@/lib/format";
import { FinanceAnomaliesSkeleton } from "@/components/finance/FinanceAnomaliesSkeleton";
import { FinanceAnomaliesTable, type AnomalyPoint } from "@/components/finance/FinanceAnomaliesTable";

type Api = {
  daily: Array<{
    day: string;
    outflow: number | string;
    avg_outflow_14d: number | string;
    outflow_ratio: number | string | null;
    outflow_z: number | string | null;
    is_anomaly: boolean;
  }>;
};

type TxnApi = {
  txns: Array<{
    txn_id: string;
    category: string | null;
    counterparty: string | null;
    direction: string | null;
    amount: number | string;
    memo: string | null;
  }>;
};

export default function FinanceAnomaliesPage() {
  const [rows, setRows] = React.useState<AnomalyPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [pickedDay, setPickedDay] = React.useState<string | null>(null);
  
  const [txns, setTxns] = React.useState<
    Array<{
      txn_id: string;
      category: string;
      counterparty: string;
      direction: string;
      amount: number;
      memo: string | null;
    }>
  >([]);
  const [txLoading, setTxLoading] = React.useState(false);
  const [threshold, setThreshold] = React.useState<number | null>(null);
  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/finance/settings", { cache: "no-store", signal: ac.signal });
        if (!res.ok) return;
        const json = await res.json();
        setThreshold(Number(json?.settings?.anomaly_threshold ?? 2));
        setLoading(true);
        setErr(null);

       const [anomRes, settingsRes] = await Promise.all([
        fetch("/api/finance/anomalies", { cache: "no-store", signal: ac.signal }),
        fetch("/api/finance/settings", { cache: "no-store", signal: ac.signal }),
      ]);

      if (!anomRes.ok) throw new Error(`Anomalies HTTP ${anomRes.status}`);
      if (!settingsRes.ok) throw new Error(`Settings HTTP ${settingsRes.status}`);

      const anomJson = await anomRes.json();
      const settingsJson = await settingsRes.json();

      const normalized: AnomalyPoint[] = (anomJson.daily ?? []).map((r: any) => ({
      day: String(r.day).slice(0, 10),
      outflow: Number(r.outflow ?? 0),
      avg_outflow_14d: Number(r.avg_outflow_14d ?? 0),
      outflow_ratio: r.outflow_ratio == null ? null : Number(r.outflow_ratio),
      outflow_z: r.outflow_z == null ? null : Number(r.outflow_z),
      is_anomaly: Boolean(r.is_anomaly),
    }));

        setRows(normalized);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load anomalies");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  async function loadTxns(day: string) {
    try {
      setPickedDay(day);
      setTxLoading(true);

      const res = await fetch(`/api/finance/anomalies/txns?day=${encodeURIComponent(day)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as TxnApi;

      const normalized = (json.txns ?? []).map((t: any) => ({
        txn_id: String(t.txn_id ?? ""),
        category: String(t.category ?? "—"),
        counterparty: String(t.counterparty ?? "—"),
        direction: String(t.direction ?? "—"),
        amount: Number(t.amount ?? 0),
        memo: t.memo == null ? null : String(t.memo),
      }));

      setTxns(normalized);
    } catch {
      setTxns([]);
    } finally {
      setTxLoading(false);
    }
  }

  if (loading) return <FinanceAnomaliesSkeleton />;

  if (err) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Anomalies</div>
        <div className="mt-2 text-sm text-danger">{err}</div>
      </div>
    );
  }

  const flagged = rows.filter((r) => r.is_anomaly);
  const worst = flagged.slice().sort((a, b) => b.outflow - a.outflow)[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Anomalies</h1>
        <p className="text-sm text-muted-foreground">
          Detects abnormal outflow spikes vs trailing 14-day baseline (last 30 days).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Anomaly days (30d)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{flagged.length}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Largest anomaly outflow</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(worst?.outflow ?? 0)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{worst?.day ?? "—"}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Rule</div>
          <div className="mt-1 text-sm text-foreground">Outflow ≥ {threshold ?? 2}× trailing 14d avg</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Baseline excludes current day</div>
        </div>
      </div>

      <FinanceAnomaliesTable rows={rows} onPickDay={loadTxns} />

      {pickedDay && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-foreground">Top transactions</div>
            <div className="text-xs text-muted-foreground">{pickedDay}</div>
          </div>

          {txLoading ? (
            <div className="mt-3 h-24 rounded-xl bg-muted/30" />
          ) : txns.length === 0 ? (
            <div className="mt-3 text-sm text-muted-foreground">No transactions found for this day.</div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-medium">Counterparty</th>
                    <th className="text-left py-2 px-3 font-medium">Category</th>
                    <th className="text-left py-2 px-3 font-medium">Dir</th>
                    <th className="text-right py-2 pl-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.txn_id} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-foreground">{t.counterparty}</td>
                      <td className="py-2 px-3 text-muted-foreground">{t.category}</td>
                      <td className="py-2 px-3 text-muted-foreground">{t.direction}</td>
                      <td className="py-2 pl-3 text-right text-foreground">{money(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}