"use client";

import * as React from "react";
import { FinanceInsightsSkeleton } from "@/components/finance/FinanceInsightsSkeleton";
import { FinanceInsightsPanel } from "@/components/finance/FinanceInsightsPanel";
import { buildFinanceAiInsights } from "@/lib/finance/ai-insights";

type InsightsApi = {
  kpis: {
    inflow_30d: number | string;
    outflow_30d: number | string;
    net_cash_flow_30d: number | string;
  } | null;

  daily: Array<{ day: string; inflow: number | string; outflow: number | string; net: number | string }>;

  topCategories: Array<{
    category: string;
    inflow: number | string;
    outflow: number | string;
    net: number | string;
    txn_count: number | string;
  }>;

  topCounterparties: Array<{
    counterparty: string;
    inflow: number | string;
    outflow: number | string;
    net: number | string;
    txn_count: number | string;
  }>;
};

export default function FinanceInsightsPage() {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [kpis, setKpis] = React.useState<{ inflow30: number; outflow30: number; net30: number } | null>(null);
  const [series, setSeries] = React.useState<Array<{ day: string; inflow: number; outflow: number; net: number }>>(
    []
  );

  const [topCategories30d, setTopCategories30d] = React.useState<
    Array<{ category: string; inflow: number; outflow: number; net: number; txn_count: number }>
  >([]);

  const [topCounterparties30d, setTopCounterparties30d] = React.useState<
    Array<{ counterparty: string; inflow: number; outflow: number; net: number; txn_count: number }>
  >([]);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/finance/insights", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`Insights HTTP ${res.status}`);

        const data = (await res.json()) as InsightsApi;

        const inflow30 = Number(data.kpis?.inflow_30d ?? 0);
        const outflow30 = Number(data.kpis?.outflow_30d ?? 0);
        const net30 = Number(data.kpis?.net_cash_flow_30d ?? 0);

        const normalizedSeries = (data.daily ?? []).map((r) => ({
          day: String(r.day).slice(0, 10),
          inflow: Number(r.inflow ?? 0),
          outflow: Number(r.outflow ?? 0),
          net: Number(r.net ?? 0),
        }));

        const cats = (data.topCategories ?? []).map((r) => ({
          category: String(r.category ?? "Unknown"),
          inflow: Number(r.inflow ?? 0),
          outflow: Number(r.outflow ?? 0),
          net: Number(r.net ?? 0),
          txn_count: Number(r.txn_count ?? 0),
        }));

        const cps = (data.topCounterparties ?? []).map((r) => ({
          counterparty: String(r.counterparty ?? "Unknown"),
          inflow: Number(r.inflow ?? 0),
          outflow: Number(r.outflow ?? 0),
          net: Number(r.net ?? 0),
          txn_count: Number(r.txn_count ?? 0),
        }));

        setKpis({ inflow30, outflow30, net30 });
        setSeries(normalizedSeries);
        setTopCategories30d(cats);
        setTopCounterparties30d(cps);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load AI insights");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  if (loading) {
  return <FinanceInsightsSkeleton />;
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">AI Insights</div>
        <div className="mt-2 text-sm text-danger">{err}</div>
      </div>
    );
  }

if (!kpis) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">AI Insights</div>
      <div className="mt-2 text-sm text-muted-foreground">
        No finance data available yet.
      </div>
    </div>
  );
}

  // ✅ THIS is where you "paste" the topCategories/topCounterparties into AI insights
  const { headline, insights } = buildFinanceAiInsights({
    kpis,
    series,
    topCategories30d,
    topCounterparties30d,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">AI Insights</h1>
        <p className="text-sm text-muted-foreground">
          Finance narratives generated from real KPIs + daily cashflow + top categories/counterparties.
        </p>
      </div>

      <FinanceInsightsPanel headline={headline} insights={insights} />
    </div>
  );
}