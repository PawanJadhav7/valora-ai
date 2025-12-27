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

  const wrapRef = React.useRef<HTMLDivElement | null>(null);

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
    labelIdx.add(clamp(i, 0, series.length - 1))
  );

  // --- Tooltip state ---
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [tipPos, setTipPos] = React.useState<{ left: number; top: number } | null>(null);

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!wrapRef.current || series.length === 0) return;

    const rect = wrapRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // convert pixel X into viewBox X
    const scaleX = rect.width / w;
    const scaleY = rect.height / h;
    const vx = px / scaleX; // viewBox space

    // invert x(i) -> i
    const t = (vx - padL) / (w - padL - padR);
    const i = clamp(Math.round(t * (series.length - 1)), 0, series.length - 1);

    setHoverIdx(i);

    // position tooltip near net point (in pixels relative to wrapper)
    const left = x(i) * scaleX;
    const top = netY(series[i].net) * scaleY;

    // small offset so it doesn't cover the cursor
    setTipPos({ left: left + 10, top: top - 10 });

    // optional: if user is hovering near bottom, push tooltip upward
    // (keeping it simple for now)
  }

  function handleLeave() {
    setHoverIdx(null);
    setTipPos(null);
  }

  const hoverPoint = hoverIdx != null ? series[hoverIdx] : null;

  // --- net line split (green above 0, red below 0) ---
type Pt = { x: number; y: number; net: number };

const pts: Pt[] = series.map((d, i) => ({
  x: x(i),
  y: netY(d.net),
  net: d.net,
}));

function buildSplitNetPaths(points: Pt[]) {
  const pos: string[] = [];
  const neg: string[] = [];

  const push = (arr: string[], px: number, py: number, moveIfFirst = false) => {
    arr.push(`${(moveIfFirst || arr.length === 0) ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`);
  };

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const aPos = a.net >= 0;
    const bPos = b.net >= 0;

    // start segment
    if (aPos) {
      if (pos.length === 0) push(pos, a.x, a.y, true);
    } else {
      if (neg.length === 0) push(neg, a.x, a.y, true);
    }

    // no sign change: continue same path
    if (aPos === bPos) {
      if (aPos) push(pos, b.x, b.y);
      else push(neg, b.x, b.y);
      continue;
    }

    // sign change: add intersection at net=0
    const t = a.net / (a.net - b.net); // 0..1
    const xi = a.x + t * (b.x - a.x);
    const yi = netY(0);

    // finish current side to intersection
    if (aPos) push(pos, xi, yi);
    else push(neg, xi, yi);

    // start the other side from intersection to b
    if (bPos) {
      push(pos, xi, yi, true);
      push(pos, b.x, b.y);
    } else {
      push(neg, xi, yi, true);
      push(neg, b.x, b.y);
    }
  }

  return {
    posPath: pos.join(" "),
    negPath: neg.join(" "),
  };
}

const { posPath, negPath } = buildSplitNetPaths(pts);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Daily cashflow (30 days)</div>
          <div className="text-xs text-muted-foreground">Inflow vs outflow bars + net line</div>
        </div>
        <div className="text-[11px] text-muted-foreground">Max scale: {money(max)}</div>
      </div>

      {/* chart wrapper for tooltip positioning */}
      <div
        ref={wrapRef}
        className="relative mt-3 rounded-xl border border-border bg-background/40 overflow-hidden"
      >
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-56 text-foreground"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        >
          {/* grid lines */}
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

          {/* zero line for net */}
          <line
            x1={padL}
            x2={w - padR}
            y1={netY(0)}
            y2={netY(0)}
            stroke="currentColor"
            strokeOpacity="0.25"
          />

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
                  opacity="0.25"
                />
                <rect
                  x={xi + 1}
                  y={y(d.outflow)}
                  width={barW}
                  height={Math.max(0, outflowH)}
                  fill="currentColor"
                  opacity="0.12"
                />
              </g>
            );
          })}

          {/* net line split: green above 0, red below 0 */}
          {posPath && (
            <path
              d={posPath}
              fill="none"
              stroke="currentColor"
              className="text-success"
              strokeWidth="2.5"
              opacity="0.95"
            />
          )}

          {negPath && (
            <path
              d={negPath}
              fill="none"
              stroke="currentColor"
              className="text-danger"
              strokeWidth="2.5"
              opacity="0.95"
            />
          )}

          {/* hover guide */}
          {hoverIdx != null && hoverPoint && (
            <g>
              <line
                x1={x(hoverIdx)}
                x2={x(hoverIdx)}
                y1={padT}
                y2={h - padB}
                stroke="currentColor"
                strokeOpacity="0.18"
              />
              <circle
                cx={x(hoverIdx)}
                cy={netY(hoverPoint.net)}
                r="3.5"
                fill="currentColor"
                opacity="0.95"
              />
            </g>
          )}

          {/* y-axis labels */}
          <text x={8} y={padT + 10} fontSize="10" fill="currentColor" opacity="0.7">
            {money(max)}
          </text>
          <text x={8} y={h - padB} fontSize="10" fill="currentColor" opacity="0.7">
            {money(0)}
          </text>

          {/* x-axis labels */}
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

        {/* tooltip */}
        {hoverPoint && tipPos && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
            style={{ left: tipPos.left, top: tipPos.top }}
          >
            <div className="text-[11px] text-muted-foreground">{hoverPoint.day}</div>
            <div className="mt-1 text-xs text-foreground">
              Inflow: <span className="font-semibold">{money(hoverPoint.inflow)}</span>
            </div>
            <div className="text-xs text-foreground">
              Outflow: <span className="font-semibold">{money(hoverPoint.outflow)}</span>
            </div>
            <div className="text-xs text-foreground">
              Net: <span className="font-semibold">{money(hoverPoint.net)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Bars: inflow (strong) + outflow (lighter). Line: net.
      </div>
    </div>
  );
}