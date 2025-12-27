"use client";

import * as React from "react";
import { FinanceForecastChart } from "@/components/finance/FinanceForecastChart";
import { money } from "@/lib/format";

type Api = {
  past: Array<{ day: string; inflow: number | string; outflow: number | string; net: number | string }>;
  future: Array<{ day: string; inflow_fcst: number | string; outflow_fcst: number | string; net_fcst: number | string }>;
};

type Point = { day: string; inflow: number; outflow: number; net: number };

export default function FinanceForecastPage() {
  const [past, setPast] = React.useState<Point[]>([]);
  const [future, setFuture] = React.useState<Point[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/finance/forecast", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as Api;

        const pastNorm: Point[] = (data.past ?? []).map((r: any) => ({
          day: String(r.day).slice(0, 10),
          inflow: Number(r.inflow ?? 0),
          outflow: Number(r.outflow ?? 0),
          net: Number(r.net ?? 0),
        }));

        const futNorm: Point[] = (data.future ?? []).map((r: any) => ({
          day: String(r.day).slice(0, 10),
          inflow: Number(r.inflow_fcst ?? 0),
          outflow: Number(r.outflow_fcst ?? 0),
          net: Number(r.net_fcst ?? 0),
        }));

        setPast(pastNorm);
        setFuture(futNorm);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load forecast");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  if (loading) return <div className="rounded-2xl border border-border bg-card p-4">Loading forecast…</div>;

  if (err) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">Forecast</div>
        <div className="mt-2 text-sm text-danger">{err}</div>
      </div>
    );
  }

  const netFuture = future.reduce((s, d) => s + d.net, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Forecast</h1>
        <p className="text-sm text-muted-foreground">
          Next 30 days forecast based on weekday averages from the last 8 weeks.
        </p>
        <div className="mt-2 text-[11px] text-muted-foreground">
          Forecast net (next 30d): <span className="text-foreground font-semibold">{money(netFuture)}</span>
        </div>
      </div>

      <FinanceForecastChart past={past} future={future} />
    </div>
  );
}