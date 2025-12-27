"use client";

import * as React from "react";
import { FinanceKpiTiles } from "@/components/finance/FinanceKpiTiles";
import { FinanceBars } from "@/components/finance/FinanceBars";
import { FinanceOverviewSkeleton } from "@/components/finance/FinanceOverviewSkeleton";
import { buildFinanceInsights } from "@/lib/finance/insights";
import { FinanceInsightsCard } from "@/components/finance/FinanceInsightsCard";
import { FinanceExecutiveSummary } from "@/components/finance/FinanceExecutiveSummary";
import { buildFinanceExecutiveSummary } from "@/lib/finance/executive-summary";


type KpiBundle = {
  financeKPIs?: {
    inflow_30d?: number;
    outflow_30d?: number;
    net_cash_flow_30d?: number;
  };
};

export default function FinanceOverviewPage() {
  const [kpis, setKpis] = React.useState<KpiBundle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [execSummary, setExecSummary] = React.useState<ReturnType<typeof buildFinanceExecutiveSummary> | null>(null);

 React.useEffect(() => {
  const ac = new AbortController();

  (async () => {
    try {
      setLoading(true);
      setErr(null);

      const [kpisRes, insightsRes] = await Promise.all([
        fetch("/api/kpis", { cache: "no-store", signal: ac.signal }),
        fetch("/api/finance/insights", { cache: "no-store", signal: ac.signal }),
      ]);

      if (!kpisRes.ok) throw new Error(`KPIs HTTP ${kpisRes.status}`);
      if (!insightsRes.ok) throw new Error(`Insights HTTP ${insightsRes.status}`);

      const kpisJson = (await kpisRes.json()) as KpiBundle;
      const insightsJson = await insightsRes.json();

      setKpis(kpisJson);

      const inflow = Number(kpisJson.financeKPIs?.inflow_30d ?? 0);
      const outflow = Number(kpisJson.financeKPIs?.outflow_30d ?? 0);
      const net = Number(kpisJson.financeKPIs?.net_cash_flow_30d ?? 0);

      const daily = (insightsJson.daily ?? []).map((r: any) => ({
        day: String(r.day).slice(0, 10),
        inflow: Number(r.inflow ?? 0),
        outflow: Number(r.outflow ?? 0),
        net: Number(r.net ?? 0),
      }));

      const topCategories30d = (insightsJson.topCategories ?? []).map((r: any) => ({
        category: String(r.category ?? "—"),
        inflow: Number(r.inflow ?? 0),
        outflow: Number(r.outflow ?? 0),
        net: Number(r.net ?? 0),
        txn_count: Number(r.txn_count ?? 0),
      }));

      const topCounterparties30d = (insightsJson.topCounterparties ?? []).map((r: any) => ({
        counterparty: String(r.counterparty ?? "—"),
        inflow: Number(r.inflow ?? 0),
        outflow: Number(r.outflow ?? 0),
        net: Number(r.net ?? 0),
        txn_count: Number(r.txn_count ?? 0),
      }));

      const summary = buildFinanceExecutiveSummary({
        kpis: { inflow30: inflow, outflow30: outflow, net30: net },
        daily,
        topCategories30d,
        topCounterparties30d,
      });

      setExecSummary(summary);
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load KPIs");
    } finally {
      setLoading(false);
    }
  })();

  return () => ac.abort();
}, []);

  if (loading) return <FinanceOverviewSkeleton />;

  if (err) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Finance overview</div>
        <div className="mt-2 text-sm text-danger">{err}</div>
      </div>
    );
  }

  const inflow = Number(kpis?.financeKPIs?.inflow_30d ?? 0);
  const outflow = Number(kpis?.financeKPIs?.outflow_30d ?? 0);
  const net = Number(kpis?.financeKPIs?.net_cash_flow_30d ?? 0);
  const insights = buildFinanceInsights({ inflow, outflow, net });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Finance</h1>
        <p className="text-sm text-muted-foreground">Executive overview (last 30 days).</p>
      </div>
      {execSummary && (
        <FinanceExecutiveSummary 
          headline={execSummary.headline}
          signals={execSummary.signals}
          callout={execSummary.callout}
          actions={execSummary.actions}
        />
      )}

        <FinanceKpiTiles inflow={inflow} outflow={outflow} net={net} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FinanceBars inflow={inflow} outflow={outflow} net={net} />

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-semibold text-foreground mb-2">Quick signal</div>
          <div className="text-sm text-muted-foreground">Net as % of inflow</div>
          <div className="mt-2 text-2xl font-semibold text-foreground">
            {inflow > 0 ? `${((net / inflow) * 100).toFixed(2)}%` : "—"}
          </div>
        </div>
      </div>
      
      <FinanceInsightsCard insights={insights} />
    </div>
  );
}