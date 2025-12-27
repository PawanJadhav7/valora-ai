"use client";

import * as React from "react";
import { money } from "@/lib/format";

export type CashflowPoint = {
  day: string; // YYYY-MM-DD
  inflow: number;
  outflow: number;
  net: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function FinanceCashflowChart({ series }: { series: CashflowPoint[] }) {
  const w = 720;
  const h = 240;
  const padL = 44;
  const padR = 16;
  const padT = 14;
  const padB = 34;

  const values = series.flatMap((d) => [d.inflow, d.outflow, Math.abs(d.net)]);
  const max = Math.max(1, ...values);

  const x = (i: number) => padL + (i * (w - padL - padR)) / Math.max(1, series.length - 1);

  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB);

  const netY = (v: number) => {
    const minNet = -max;
    const maxNet = max;
    const t = (v - minNet) / (maxNet - minNet);
    return padT + (1 - t) * (h - padT - padB);
  };

  const barW = clamp((w - padL - padR) / Math.max(1, series.length) / 2.2, 4, 10);

  const netPath = series
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${netY(d.net).toFixed(2)}`)
    .join(" ");

  const labelIdx = new Set<number>();
  [0, Math.floor(series.length / 2), series.length - 1].forEach((i) =>
    labelIdx.add(clamp(i, 0, Math.max(0, series.length - 1)))
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Daily cashflow (30 days)</div>
          <div className="text-xs text-muted-foreground">Inflow vs outflow bars + net line</div>
        </div>
        <div className="text-[11px] text-muted-foreground">Max scale: {money(max)}</div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background/40 overflow-hidden">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56 text-foreground">
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
                opacity={0.15}
              />
            );
          })}

          {/* net zero line */}
          <line x1={padL} x2={w - padR} y1={netY(0)} y2={netY(0)} stroke="currentColor" opacity={0.25} />

          {/* bars */}
          {series.map((d, i) => {
            const xi = x(i);
            const inflowH = (h - padT - padB) - (y(d.inflow) - padT);
            const outflowH = (h - padT - padB) - (y(d.outflow) - padT);

            return (
              <g key={d.day}>
                <rect
                  x={xi - barW - 1}
                  y={y(d.inflow)}
                  width={barW}
                  height={Math.max(0, inflowH)}
                  fill="currentColor"
                  opacity={0.25}
                />
                <rect
                  x={xi + 1}
                  y={y(d.outflow)}
                  width={barW}
                  height={Math.max(0, outflowH)}
                  fill="currentColor"
                  opacity={0.12}
                />
              </g>
            );
          })}

          {/* net line */}
          <path d={netPath} fill="none" stroke="currentColor" strokeWidth="2" opacity={0.9} />

          {/* y labels */}
          <text x={8} y={padT + 10} fontSize="10" fill="currentColor" opacity={0.7}>
            {money(max)}
          </text>
          <text x={8} y={h - padB} fontSize="10" fill="currentColor" opacity={0.7}>
            {money(0)}
          </text>

          {/* x labels */}
          {series.map((d, i) =>
            labelIdx.has(i) ? (
              <text
                key={`lbl-${d.day}`}
                x={x(i)}
                y={h - 12}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity={0.65}
              >
                {d.day.slice(5)}
              </text>
            ) : null
          )}
        </svg>
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">Bars: inflow (strong) + outflow (lighter). Line: net.</div>
    </div>
  );
}