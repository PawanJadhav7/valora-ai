"use client";

import * as React from "react";
import { money } from "@/lib/format";

export type BudgetPoint = {
  month: string; // YYYY-MM-01
  budget_outflow: number;
  actual_outflow: number;
  variance: number;
  variance_pct: number | null;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function FinanceBudgetChart({ monthly }: { monthly: BudgetPoint[] }) {
  const w = 720, h = 240;
  const padL = 44, padR = 16, padT = 14, padB = 34;

  const max = Math.max(
    1,
    ...monthly.flatMap((d) => [Math.abs(d.budget_outflow), Math.abs(d.actual_outflow)])
  );

  const x = (i: number) => padL + (i * (w - padL - padR)) / Math.max(1, monthly.length - 1);
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB);

  const barW = clamp((w - padL - padR) / Math.max(1, monthly.length) / 2.2, 6, 14);

  const labelIdx = new Set<number>();
  [0, Math.floor(monthly.length / 2), monthly.length - 1].forEach((i) =>
    labelIdx.add(clamp(i, 0, monthly.length - 1))
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Budget vs Actual (12 months)</div>
          <div className="text-xs text-muted-foreground">Budgeted outflow vs actual outflow</div>
        </div>
        <div className="text-[11px] text-muted-foreground">Max: {money(max)}</div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background/40 overflow-hidden">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56">
          {/* grid */}
          {[0.25, 0.5, 0.75].map((t) => {
            const yy = padT + t * (h - padT - padB);
            return (
              <line
                key={t}
                x1={padL}
                x2={w - padR}
                y1={yy}
                y2={yy}
                stroke="currentColor"
                strokeOpacity="0.15"
              />
            );
          })}

          {monthly.map((d, i) => {
            const xi = x(i);
            const bH = (h - padT - padB) - (y(d.budget_outflow) - padT);
            const aH = (h - padT - padB) - (y(d.actual_outflow) - padT);

            return (
              <g key={d.month}>
                {/* budget */}
                <rect
                  x={xi - barW - 1}
                  y={y(d.budget_outflow)}
                  width={barW}
                  height={Math.max(0, bH)}
                  fill="currentColor"
                  opacity="0.18"
                  className="text-primary"
                />
                {/* actual */}
                <rect
                  x={xi + 1}
                  y={y(d.actual_outflow)}
                  width={barW}
                  height={Math.max(0, aH)}
                  fill="currentColor"
                  opacity="0.35"
                  className="text-danger"
                />
              </g>
            );
          })}

          {/* labels */}
          {monthly.map((d, i) =>
            labelIdx.has(i) ? (
              <text
                key={`lbl-${d.month}`}
                x={x(i)}
                y={h - 12}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity="0.65"
              >
                {d.month.slice(0, 7)}
              </text>
            ) : null
          )}
        </svg>
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Left bar: Budget (primary). Right bar: Actual (danger).
      </div>
    </div>
  );
}