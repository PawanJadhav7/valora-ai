"use client";

import * as React from "react";

type Settings = {
  currency: string;
  fiscal_start: string;
  anomaly_threshold: number;
};

export default function FinanceSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [currency, setCurrency] = React.useState("USD");
  const [fiscalStart, setFiscalStart] = React.useState("Jan");
  const [anomalyThreshold, setAnomalyThreshold] = React.useState(2);

  React.useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/finance/settings", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { settings: Settings | null };

        const s = json.settings;
        if (s) {
          setCurrency(String(s.currency ?? "USD"));
          setFiscalStart(String(s.fiscal_start ?? "Jan"));
          setAnomalyThreshold(Number(s.anomaly_threshold ?? 2));
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  async function save() {
    try {
      setSaving(true);
      setErr(null);

      const res = await fetch("/api/finance/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          fiscal_start: fiscalStart,
          anomaly_threshold: anomalyThreshold,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Persisted Finance preferences.</p>
        </div>

        <button
          onClick={save}
          disabled={loading || saving}
          className="text-xs px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted/40 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm text-danger">
          {err}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="text-sm font-semibold text-foreground">General</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="text-xs text-muted-foreground">Default currency</div>
            <select
              disabled={loading}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="INR">INR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="text-xs text-muted-foreground">Fiscal year starts</div>
            <select
              disabled={loading}
              value={fiscalStart}
              onChange={(e) => setFiscalStart(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="Jan">January</option>
              <option value="Apr">April</option>
              <option value="Jul">July</option>
              <option value="Oct">October</option>
            </select>
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="text-xs text-muted-foreground">Anomaly threshold</div>
            <div className="mt-2 flex items-center gap-3">
              <input
                disabled={loading}
                type="range"
                min={1.5}
                max={3}
                step={0.1}
                value={anomalyThreshold}
                onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-foreground w-12 text-right">
                {anomalyThreshold.toFixed(1)}×
              </div>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              This will be used to flag anomalies.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}