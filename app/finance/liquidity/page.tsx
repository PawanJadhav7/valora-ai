"use client";

import * as React from "react";
import { money } from "@/lib/format";
import { FinanceLiquidityChart, type LiquidityPoint } from "@/components/finance/FinanceLiquidityChart";
import { FinanceLiquiditySkeleton } from "@/components/finance/FinanceLiquiditySkeleton";

type Api = {
  kpis: {
    as_of: string;
    cash_position_index: number | string;
    avg_daily_outflow: number | string;
    avg_daily_net: number | string;
    runway_days: number | string | null;
    min_cash_index: number | string;
    max_cash_index: number | string;
  } | null;
  daily: Array<{
    day: string;
    inflow: number | string;
    outflow: number | string;
    net: number | string;
    cash_position_index: number | string;
  }>;
};

export default function FinanceLiquidityPage() {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [kpis, setKpis] = React.useState<Api["kpis"]>(null);
  const [daily, setDaily] = React.useState<LiquidityPoint[]>([]);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/finance/liquidity", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as Api;

        const normalized = (json.daily ?? []).map((r) => ({
          day: String(r.day).slice(0, 10),
          inflow: Number(r.inflow ?? 0),
          outflow: Number(r.outflow ?? 0),
          net: Number(r.net ?? 0),
          cashIndex: Number(r.cash_position_index ?? 0),
        }));

        setKpis(json.kpis);
        setDaily(normalized);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load liquidity");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  if (loading) return <FinanceLiquiditySkeleton />;

  if (err) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Liquidity</div>
        <div className="mt-2 text-sm text-danger">{err}</div>
      </div>
    );
  }

  const cashIndex = Number(kpis?.cash_position_index ?? 0);
  const burn = Number(kpis?.avg_daily_outflow ?? 0);
  const runway = kpis?.runway_days == null ? null : Number(kpis.runway_days);

  const runwayBadge =
    runway == null ? "—" : runway >= 60 ? `${runway} days` : runway >= 30 ? `${runway} days` : `${runway} days`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Liquidity</h1>
        <p className="text-sm text-muted-foreground">
          Cash position index + burn/runway signals (last 30 days).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Cash position (index)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(cashIndex)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Starts at 0 (30d ago), moves by daily net
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Avg daily outflow (30d)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{money(burn)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Burn proxy</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Runway (days)</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{runwayBadge}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Only computed when cashIndex &gt; 0
          </div>
        </div>
      </div>

      <FinanceLiquidityChart series={daily} />
    </div>
  );
}