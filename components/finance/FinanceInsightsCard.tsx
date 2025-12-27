"use client";

import * as React from "react";
import type { FinanceInsight } from "@/lib/finance/insights";

function badge(sev: FinanceInsight["severity"]) {
  if (sev === "good") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-300";
  if (sev === "warn") return "border-amber-400/40 bg-amber-500/10 text-amber-200";
  return "border-rose-400/40 bg-rose-500/10 text-rose-200";
}

export function FinanceInsightsCard({ insights }: { insights: FinanceInsight[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">Finance insights</div>
        <div className="text-xs text-muted-foreground">Last 30 days</div>
      </div>

      <div className="mt-3 space-y-3">
        {insights.map((i) => (
          <div key={i.id} className="rounded-xl border border-border bg-background/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">{i.title}</div>
              <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${badge(i.severity)}`}>
                {i.severity.toUpperCase()}
              </span>
            </div>

            <div className="mt-1 text-sm text-muted-foreground">{i.body}</div>

            {i.cta && <div className="mt-2 text-xs text-cyan-300">{i.cta} →</div>}
          </div>
        ))}
      </div>
    </div>
  );
}