"use client";

import * as React from "react";
import { money } from "@/lib/format";
import { FinanceRevenueChart, type RevenuePoint } from "@/components/finance/FinanceRevenueChart";

type RevenueApi = {
  daily: Array<{ day: string; revenue: number | string }>;
  topCategories: Array<{ category: string; revenue: number | string; txn_count: number | string }>;
  topCounterparties: Array<{ counterparty: string; revenue: number | string; txn_count: number | string }>;
};

export default function FinanceRevenuePage() {
  const [series, setSeries] = React.useState<RevenuePoint[]>([]);
  const [cats, setCats] = React.useState<Array<{ category: string; revenue: number; txn_count: number }>>([]);
  const [cps, setCps] = React.useState<Array<{ counterparty: string; revenue: number; txn_count: number }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/finance/revenue", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as RevenueApi;

        setSeries(
          (data.daily ?? []).map((r) => ({
            day: String(r.day).slice(0, 10),
            revenue: Number(r.revenue ?? 0),
          }))
        );

        setCats(
          (data.topCategories ?? []).map((r) => ({
            category: String(r.category ?? "Uncategorized"),
            revenue: Number(r.revenue ?? 0),
            txn_count: Number(r.txn_count ?? 0),
          }))
        );

        setCps(
          (data.topCounterparties ?? []).map((r) => ({
            counterparty: String(r.counterparty ?? "Unknown"),
            revenue: Number(r.revenue ?? 0),
            txn_count: Number(r.txn_count ?? 0),
          }))
        );
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load revenue");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Revenue</div>
        <div className="mt-2 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Revenue</div>
        <div className="mt-2 text-sm text-danger">{err}</div>
      </div>
    );
  }

  const total30 = series.reduce((s, d) => s + d.revenue, 0);
  const avgDaily = series.length ? total30 / series.length : 0;
  const maxDay = [...series].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Revenue</h1>
        <p className="text-sm text-muted-foreground">Revenue drivers and daily trend (last 30 days).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total revenue (30d)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(total30)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Avg daily</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(avgDaily)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Largest day</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {maxDay ? money(maxDay.revenue) : "—"}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{maxDay ? maxDay.day : ""}</div>
        </div>
      </div>

      <FinanceRevenueChart series={series} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-semibold text-foreground mb-2">Top revenue categories</div>
          <div className="space-y-2">
            {cats.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-sm">
                <div className="text-foreground">{c.category}</div>
                <div className="text-muted-foreground">{money(c.revenue)} • {c.txn_count} txns</div>
              </div>
            ))}
            {!cats.length && <div className="text-sm text-muted-foreground">No category data.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-semibold text-foreground mb-2">Top customers (counterparties)</div>
          <div className="space-y-2">
            {cps.map((c) => (
              <div key={c.counterparty} className="flex items-center justify-between text-sm">
                <div className="text-foreground">{c.counterparty}</div>
                <div className="text-muted-foreground">{money(c.revenue)} • {c.txn_count} txns</div>
              </div>
            ))}
            {!cps.length && <div className="text-sm text-muted-foreground">No counterparty data.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}