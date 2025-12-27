"use client";

import * as React from "react";
import { money } from "@/lib/format";

export type RevenuePoint = { day: string; revenue: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function FinanceRevenueChart({ series }: { series: RevenuePoint[] }) {
  const w = 720;
  const h = 240;
  const padL = 44;
  const padR = 16;
  const padT = 14;
  const padB = 34;

  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  const max = Math.max(1, ...series.map((d) => d.revenue));
  const x = (i: number) => padL + (i * (w - padL - padR)) / Math.max(1, series.length - 1);
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB);

  const barW = clamp((w - padL - padR) / Math.max(1, series.length) / 1.9, 6, 14);

  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [tipPos, setTipPos] = React.useState<{ left: number; top: number } | null>(null);

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
    const top = y(series[i].revenue) * (rect.height / h);
    setTipPos({ left: left + 10, top: top - 10 });
  }

  function handleLeave() {
    setHoverIdx(null);
    setTipPos(null);
  }

  const labelIdx = new Set<number>();
  [0, Math.floor(series.length / 2), series.length - 1].forEach((i) =>
    labelIdx.add(clamp(i, 0, series.length - 1))
  );

  const hp = hoverIdx != null ? series[hoverIdx] : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Daily revenue (30 days)</div>
          <div className="text-xs text-muted-foreground">Inflow only</div>
        </div>
        <div className="text-[11px] text-muted-foreground">Max scale: {money(max)}</div>
      </div>

      <div ref={wrapRef} className="relative mt-3 rounded-xl border border-border bg-background/40 overflow-hidden">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56" onMouseMove={handleMove} onMouseLeave={handleLeave}>
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
                strokeOpacity="0.12"
              />
            );
          })}

          {series.map((d, i) => {
            const xi = x(i);
            const yy = y(d.revenue);
            const hh = (h - padT - padB) - (yy - padT);
            return (
              <rect
                key={d.day}
                x={xi - barW / 2}
                y={yy}
                width={barW}
                height={Math.max(0, hh)}
                fill="currentColor"
                opacity="0.22"
                className="text-success"
              />
            );
          })}

          <text x={8} y={padT + 10} fontSize="10" fill="currentColor" opacity="0.7">
            {money(max)}
          </text>
          <text x={8} y={h - padB} fontSize="10" fill="currentColor" opacity="0.7">
            {money(0)}
          </text>

          {series.map((d, i) =>
            labelIdx.has(i) ? (
              <text
                key={`lbl-${d.day}`}
                x={x(i)}
                y={h - 12}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity="0.65"
              >
                {d.day.slice(5)}
              </text>
            ) : null
          )}
        </svg>

        {hp && tipPos && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
            style={{ left: tipPos.left, top: tipPos.top }}
          >
            <div className="text-[11px] text-muted-foreground">{hp.day}</div>
            <div className="mt-1 text-xs text-foreground">
              Revenue: <span className="font-semibold">{money(hp.revenue)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}