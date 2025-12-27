"use client";

import * as React from "react";
import { money } from "@/lib/format";
import { FinanceBudgetChart, type BudgetPoint } from "@/components/finance/FinanceBudgetChart";

type Api = {
  monthly: Array<{
    month: string;
    budget_outflow: number | string;
    actual_outflow: number | string;
    variance: number | string;
    variance_pct: number | string | null;
  }>;
};

export default function FinanceBudgetPage() {
  const [monthly, setMonthly] = React.useState<BudgetPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/finance/budget", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as Api;

        const norm: BudgetPoint[] = (data.monthly ?? []).map((r: any) => ({
          month: String(r.month).slice(0, 10),
          budget_outflow: Number(r.budget_outflow ?? 0),
          actual_outflow: Number(r.actual_outflow ?? 0),
          variance: Number(r.variance ?? 0),
          variance_pct: r.variance_pct == null ? null : Number(r.variance_pct),
        }));

        setMonthly(norm);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load budget");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  if (loading) return <div className="rounded-2xl border border-border bg-card p-4">Loading budget…</div>;
  if (err) return <div className="rounded-2xl border border-border bg-card p-4 text-danger">{err}</div>;

  const latest = monthly[monthly.length - 1];
  const budget = latest?.budget_outflow ?? 0;
  const actual = latest?.actual_outflow ?? 0;
  const variance = latest?.variance ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Budget</h1>
        <p className="text-sm text-muted-foreground">Monthly budget vs actual outflow (last 12 months).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">This month budget</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(budget)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">This month actual</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(actual)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Variance</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(variance)}</div>
        </div>
      </div>

      <FinanceBudgetChart monthly={monthly} />
    </div>
  );
}