"use client";

import * as React from "react";
import { money } from "@/lib/format";

type BasePoint = { day: string; inflow: number; outflow: number; net: number };

export type ForecastPoint = BasePoint & { isForecast: boolean };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type Pt = { x: number; y: number; net: number };

function buildSplitNetPaths(points: Pt[], yZero: number) {
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

    // Ensure starting point is added on the right path
    if (aPos) {
      if (pos.length === 0) push(pos, a.x, a.y, true);
    } else {
      if (neg.length === 0) push(neg, a.x, a.y, true);
    }

    // No sign change
    if (aPos === bPos) {
      if (aPos) push(pos, b.x, b.y);
      else push(neg, b.x, b.y);
      continue;
    }

    // Sign change: intersection at net=0
    const t = a.net / (a.net - b.net); // 0..1
    const xi = a.x + t * (b.x - a.x);
    const yi = yZero;

    if (aPos) push(pos, xi, yi);
    else push(neg, xi, yi);

    if (bPos) {
      push(pos, xi, yi, true);
      push(pos, b.x, b.y);
    } else {
      push(neg, xi, yi, true);
      push(neg, b.x, b.y);
    }
  }

  return { posPath: pos.join(" "), negPath: neg.join(" ") };
}

export function FinanceForecastChart({
  past,
  future,
}: {
  past: BasePoint[];
  future: BasePoint[];
}) {
  // join into one x-axis
  const series: ForecastPoint[] = [
  ...(past ?? []).map((d) => ({ ...d, isForecast: false })),
  ...(future ?? []).map((d) => ({ ...d, isForecast: true })),
];

  const w = 720;
  const h = 260;
  const padL = 44;
  const padR = 16;
  const padT = 14;
  const padB = 38;

  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  const values = series.flatMap((d) => [d.inflow, d.outflow, Math.abs(d.net)]);
  const boundaryIdx = past?.length ?? 0;
  const max = Math.max(1, ...values);

  const x = (i: number) => padL + (i * (w - padL - padR)) / Math.max(1, series.length - 1);
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB);

  const netY = (v: number) => {
    const minNet = -max;
    const maxNet = max;
    const t = (v - minNet) / (maxNet - minNet);
    return padT + (1 - t) * (h - padT - padB);
  };

  const yZero = netY(0);

  const barW = clamp((w - padL - padR) / Math.max(1, series.length) / 2.4, 4, 10);

  // split past/future net points for colored paths
  const pastPts: Pt[] = past.map((d, i) => {
    const idx = i;
    return { x: x(idx), y: netY(d.net), net: d.net };
  });

  const futurePts: Pt[] = future.map((d, j) => {
    const idx = (past.length - 1) + (j + 1); // continue after past
    return { x: x(idx), y: netY(d.net), net: d.net };
  });

  const { posPath: pastPos, negPath: pastNeg } = pastPts.length >= 2 ? buildSplitNetPaths(pastPts, yZero) : { posPath: "", negPath: "" };
  const { posPath: futPos, negPath: futNeg } = futurePts.length >= 2 ? buildSplitNetPaths(futurePts, yZero) : { posPath: "", negPath: "" };

  // labels
  const labelIdx = new Set<number>();
  [0, Math.floor(series.length / 2), series.length - 1].forEach((i) => labelIdx.add(clamp(i, 0, series.length - 1)));

  // tooltip
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [tipPos, setTipPos] = React.useState<{ left: number; top: number } | null>(null);

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!wrapRef.current || series.length === 0) return;

    const rect = wrapRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const scaleX = rect.width / w;
    const scaleY = rect.height / h;

    const vx = px / scaleX;
    const t = (vx - padL) / (w - padL - padR);
    const i = clamp(Math.round(t * (series.length - 1)), 0, series.length - 1);

    setHoverIdx(i);

    const left = x(i) * scaleX;
    const top = netY(series[i].net) * scaleY;
    setTipPos({ left: left + 10, top: top - 10 });
  }

  function handleLeave() {
    setHoverIdx(null);
    setTipPos(null);
  }

  const hover = hoverIdx != null ? series[hoverIdx] : null;
 

  // theme tokens (avoid tailwind stroke issues)
  const strokeSuccess = "hsl(var(--success))";
  const strokeDanger = "hsl(var(--danger))";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Cashflow forecast</div>
          <div className="text-xs text-muted-foreground">
            Past 30d actual + next 30d forecast (bars: inflow/outflow, line: net)
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">Max scale: {money(max)}</div>
      </div>

      <div ref={wrapRef} className="relative mt-3 rounded-xl border border-border bg-background/40 overflow-hidden">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-60" onMouseMove={handleMove} onMouseLeave={handleLeave}>

          {past.length > 0 && future.length > 0 && (
            <g>
                {/* vertical divider */}
                <line
                x1={x(boundaryIdx)}
                x2={x(boundaryIdx)}
                y1={padT}
                y2={h - padB}
                stroke="currentColor"
                strokeOpacity="0.30"
                strokeDasharray="4 4"
                />

                {/* label pill */}
                <g transform={`translate(${x(boundaryIdx)}, ${padT})`}>
                <rect
                    x={-22}
                    y={0}
                    width={44}
                    height={16}
                    rx={8}
                    fill="currentColor"
                    opacity="0.12"
                />
                <text
                    x={0}
                    y={12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="currentColor"
                    opacity="0.85"
                >
                    Today
                </text>
                </g>
            </g>
    )}

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

          {/* net zero line */}
          <line x1={padL} x2={w - padR} y1={yZero} y2={yZero} stroke="currentColor" strokeOpacity="0.25" />

          {/* bars */}
          {series.map((d, i) => {
            const xi = x(i);
            const inflowH = (h - padT - padB) - (y(d.inflow) - padT);
            const outflowH = (h - padT - padB) - (y(d.outflow) - padT);

            const inflowOpacity = d.isForecast ? 0.10 : 0.22;
            const outflowOpacity = d.isForecast ? 0.06 : 0.12;

            return (
              <g key={`${d.day}-${i}`}>
                {/* inflow */}
                <rect
                  x={xi - barW - 1}
                  y={y(d.inflow)}
                  width={barW}
                  height={Math.max(0, inflowH)}
                  fill="currentColor"
                  opacity={inflowOpacity}
                />
                {/* outflow */}
                <rect
                  x={xi + 1}
                  y={y(d.outflow)}
                  width={barW}
                  height={Math.max(0, outflowH)}
                  fill="currentColor"
                  opacity={outflowOpacity}
                />
              </g>
            );
          })}

          {/* net line (past): solid + color split */}
          {pastPos && <path d={pastPos} fill="none" stroke={strokeSuccess} strokeWidth="2.6" opacity="0.95" />}
          {pastNeg && <path d={pastNeg} fill="none" stroke={strokeDanger} strokeWidth="2.6" opacity="0.95" />}

          {/* net line (future): dashed + color split */}
          {futPos && (
            <path
              d={futPos}
              fill="none"
              stroke={strokeSuccess}
              strokeWidth="2.6"
              opacity="0.75"
              strokeDasharray="6 6"
            />
          )}
          {futNeg && (
            <path
              d={futNeg}
              fill="none"
              stroke={strokeDanger}
              strokeWidth="2.6"
              opacity="0.75"
              strokeDasharray="6 6"
            />
          )}

          {/* hover guide */}
          {hoverIdx != null && hover && (
            <g>
              <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={padT} y2={h - padB} stroke="currentColor" strokeOpacity="0.18" />
              <circle cx={x(hoverIdx)} cy={netY(hover.net)} r="3.5" fill="currentColor" opacity="0.95" />
            </g>
          )}

          {/* x labels */}
          {series.map((d, i) =>
            labelIdx.has(i) ? (
              <text key={`lbl-${d.day}-${i}`} x={x(i)} y={h - 12} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.65">
                {d.day.slice(5)}
              </text>
            ) : null
          )}
        </svg>

        {/* tooltip */}
        {hover && tipPos && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
            style={{ left: tipPos.left, top: tipPos.top }}
          >
            <div className="text-[11px] text-muted-foreground">
              {hover.day} {hover.isForecast ? "• Forecast" : "• Actual"}
            </div>
            <div className="mt-1 text-xs text-foreground">
              Inflow: <span className="font-semibold">{money(hover.inflow)}</span>
            </div>
            <div className="text-xs text-foreground">
              Outflow: <span className="font-semibold">{money(hover.outflow)}</span>
            </div>
            <div className="text-xs text-foreground">
              Net: <span className="font-semibold">{money(hover.net)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Bars: inflow (strong) + outflow (lighter). Net: solid (actual) and dashed (forecast), green/red split.
      </div>
    </div>
  );
}