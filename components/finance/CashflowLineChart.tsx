"use client";

import * as React from "react";
import type { CashflowDailyPoint } from "@/lib/finance/cashflow";
import { money } from "@/lib/format";

export function CashflowLineChart({ data }: { data: CashflowDailyPoint[] }) {
  const w = 720;
  const h = 220;
  const pad = 18;

  const xs = data.map((_, i) => i);
  const inflows = data.map((d) => d.inflow);
  const outflows = data.map((d) => d.outflow);

  const max = Math.max(...inflows, ...outflows, 1);
  const min = 0;

  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, xs.length - 1);
  const y = (v: number) => h - pad - ((v - min) * (h - pad * 2)) / (max - min || 1);

  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");

  const last = data[data.length - 1];
  const label = last ? `Last day: Inflow ${money(last.inflow)} | Outflow ${money(last.outflow)}` : "";

  const [hover, setHover] = React.useState<{
  x: number;
  y: number;
  idx: number;
} | null>(null);

function handleMove(e: React.MouseEvent<SVGElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const xPos = e.clientX - rect.left;
  const yPos = e.clientY - rect.top;

  const idx = Math.round(
    ((xPos - pad) / (w - pad * 2)) * (data.length - 1)
  );

  if (idx >= 0 && idx < data.length) {
    setHover({ x: xPos, y: yPos, idx });
  }
}

function handleLeave() {
  setHover(null);
}


  return (
    
    <div className="rounded-2xl border border-border bg-card p-4">
        <div className="p-4 border border-red-500 bg-red-500/10 text-red-200">
    CASHFLOW CHART COMPONENT IS RENDERING
  </div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Cash flow trend</div>
          <div className="text-xs text-muted-foreground">Inflow vs Outflow (last 30 days) points: {data.length}</div>
        </div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
    
      <div className="rounded-xl border border-border bg-background/40 overflow-hidden">
        <div className="relative h-56">
            <div className="text-xs text-muted-foreground">points: {data.length}</div>

            <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full h-56 text-foreground"
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            >
            {/* grid */}
            <line x1={pad} y1={y(max)} x2={w - pad} y2={y(max)} stroke="currentColor" strokeOpacity="0.15" />
            <line x1={pad} y1={y(max * 0.5)} x2={w - pad} y2={y(max * 0.5)} stroke="currentColor" strokeOpacity="0.15" />

            {/* inflow */}
            <path d={path(inflows)} fill="none" stroke="currentColor" strokeWidth={2.25} className="text-cyan-300" />

            {/* outflow */}
            <path d={path(outflows)} fill="none" stroke="currentColor" strokeWidth={2.25} className="text-slate-200" />
            </svg>

            {hover && (
            <div
                className="pointer-events-none absolute rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                style={{ left: hover.x + 8, top: hover.y - 24 }}
            >
                <div className="font-medium">{data[hover.idx].day}</div>
                <div>Inflow: {money(data[hover.idx].inflow)}</div>
                <div>Outflow: {money(data[hover.idx].outflow)}</div>
                <div>Net: {money(data[hover.idx].net)}</div>
            </div>
            )}
        </div>
       </div>

    

      <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full bg-cyan-300" /> Inflow
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full bg-slate-200" /> Outflow
        </span>
      </div>
    </div>
  );
}