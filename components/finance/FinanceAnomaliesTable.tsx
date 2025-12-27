"use client";

import { money } from "@/lib/format";

export type AnomalyPoint = {
  day: string;
  outflow: number;
  avg_outflow_14d: number;
  outflow_ratio: number | null;
  outflow_z: number | null;
  is_anomaly: boolean;
};

export function FinanceAnomaliesTable({
  rows,
  onPickDay,
}: {
  rows: AnomalyPoint[];
  onPickDay: (day: string) => void;
}) {
  const flagged = rows.filter((r) => r.is_anomaly).slice().reverse();

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground mb-3">Flagged days</div>

      {flagged.length === 0 ? (
        <div className="text-sm text-muted-foreground">No anomaly days detected in the last 30 days.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium">Day</th>
                <th className="text-right py-2 px-3 font-medium">Outflow</th>
                <th className="text-right py-2 px-3 font-medium">14d Avg</th>
                <th className="text-right py-2 px-3 font-medium">Ratio</th>
                <th className="text-right py-2 pl-3 font-medium">Z</th>
              </tr>
            </thead>
            <tbody>
              {flagged.map((r) => (
                <tr
                  key={r.day}
                  onClick={() => onPickDay(r.day)}
                  className="border-b border-border/60 cursor-pointer hover:bg-muted/30"
                >
                  <td className="py-2 pr-3 text-foreground">{r.day}</td>
                  <td className="py-2 px-3 text-right text-foreground">{money(r.outflow)}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{money(r.avg_outflow_14d)}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">
                    {r.outflow_ratio == null ? "—" : r.outflow_ratio.toFixed(2)}
                  </td>
                  <td className="py-2 pl-3 text-right text-muted-foreground">
                    {r.outflow_z == null ? "—" : r.outflow_z.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-[11px] text-muted-foreground">Tip: click a day to see top transactions.</div>
        </div>
      )}
    </div>
  );
}