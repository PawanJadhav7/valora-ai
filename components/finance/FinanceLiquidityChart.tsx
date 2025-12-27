"use client";

import * as React from "react";
import { money } from "@/lib/format";

export type LiquidityPoint = {
  day: string;
  inflow: number;
  outflow: number;
  net: number;
  cashIndex: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function FinanceLiquidityChart({ series }: { series: LiquidityPoint[] }) {
  const w = 720;
  const h = 240;
  const padL = 44;
  const padR = 16;
  const padT = 14;
  const padB = 34;

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [tipPos, setTipPos] = React.useState<{ left: number; top: number } | null>(null);

  const vals = series.map((d) => d.cashIndex);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 1);

  const x = (i: number) => padL + (i * (w - padL - padR)) / Math.max(1, series.length - 1);
  const y = (v: number) => {
    const t = (v - min) / (max - min || 1);
    return padT + (1 - t) * (h - padT - padB);
  };

  const path = series
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(d.cashIndex).toFixed(2)}`)
    .join(" ");

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!wrapRef.current || series.length === 0) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;

    const scaleX = rect.width / w;
    const vx = px / scaleX;

    const t = (vx - padL) / (w - padL - padR);
    const i = clamp(Math.round(t * (series.length - 1)), 0, series.length - 1);
    setHoverIdx(i);

    const left = x(i) * scaleX;
    const scaleY = rect.height / h;
    const top = y(series[i].cashIndex) * scaleY;
    setTipPos({ left: left + 10, top: top - 10 });
  }

  function handleLeave() {
    setHoverIdx(null);
    setTipPos(null);
  }

  const hp = hoverIdx != null ? series[hoverIdx] : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Cash position (index)</div>
          <div className="text-xs text-muted-foreground">Running sum of daily net (30 days)</div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Range: {money(min)} → {money(max)}
        </div>
      </div>

      <div ref={wrapRef} className="relative mt-3 rounded-xl border border-border bg-background/40 overflow-hidden">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56" onMouseMove={handleMove} onMouseLeave={handleLeave}>
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

          {/* zero line */}
          <line x1={padL} x2={w - padR} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity="0.25" />

          {/* cash index line (use your tokens) */}
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={max >= 0 ? "stroke-success" : "stroke-danger"}
            opacity="0.95"
          />

          {/* hover guide */}
          {hoverIdx != null && hp && (
            <g>
              <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={padT} y2={h - padB} stroke="currentColor" strokeOpacity="0.18" />
              <circle cx={x(hoverIdx)} cy={y(hp.cashIndex)} r="3.5" fill="currentColor" opacity="0.95" />
            </g>
          )}
        </svg>

        {hp && tipPos && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
            style={{ left: tipPos.left, top: tipPos.top }}
          >
            <div className="text-[11px] text-muted-foreground">{hp.day}</div>
            <div className="mt-1 text-xs text-foreground">
              Cash index: <span className="font-semibold">{money(hp.cashIndex)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Net: {money(hp.net)} · In: {money(hp.inflow)} · Out: {money(hp.outflow)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Note: this is a 30-day indexed cash position unless you provide an opening cash balance.
      </div>
    </div>
  );
}