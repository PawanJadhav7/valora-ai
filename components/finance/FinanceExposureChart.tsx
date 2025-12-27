"use client";

import * as React from "react";
import { money } from "@/lib/format";

export type ExposureRow = {
  counterparty: string;
  inflow: number;
  outflow: number;
  net: number;
  txn_count: number;
};

export function FinanceExposureChart({ rows }: { rows: ExposureRow[] }) {
  const top = [...rows].sort((a, b) => b.outflow - a.outflow).slice(0, 8);
  const max = Math.max(1, ...top.map((r) => r.outflow));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Outflow concentration</div>
          <div className="text-xs text-muted-foreground">Top counterparties by outflow</div>
        </div>
        <div className="text-[11px] text-muted-foreground">Max: {money(max)}</div>
      </div>

      <div className="mt-4 space-y-3">
        {top.map((r) => {
          const w = Math.round((r.outflow / max) * 100);
          return (
            <div key={r.counterparty} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate max-w-[70%]">{r.counterparty}</span>
                <span className="text-foreground">{money(r.outflow)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted/40 ring-1 ring-border/60 overflow-hidden">
                <div className="h-full bg-danger/80" style={{ width: `${w}%` }} />
              </div>
            </div>
          );
        })}
        {!top.length && <div className="text-sm text-muted-foreground">No data yet.</div>}
      </div>
    </div>
  );
}