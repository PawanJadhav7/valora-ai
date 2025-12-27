"use client";

import * as React from "react";

export type KpiBundle = {
  ecommerceKPIs?: any;
  financeKPIs?: any;
  healthcareKPIs?: any;
  saasKPIs?: any;
  insuranceKPIs?: any;
  supplyKPIs?: any; // note: your JSON uses supplyKPIs
};

export function useKpis() {
  const [kpis, setKpis] = React.useState<KpiBundle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/kpis", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as KpiBundle;
        setKpis(data);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "Failed to load KPIs");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  return { kpis, loading, error };
}