"use client";

import * as React from "react";

type Insight = {
  title: string;
  severity: "good" | "warn" | "risk";
  narrative: string;
  bullets?: string[];
};

function pill(severity: Insight["severity"]) {
  if (severity === "good") return "bg-success/15 text-success border-success/30";
  if (severity === "risk") return "bg-danger/15 text-danger border-danger/30";
  return "bg-primary/10 text-primary border-primary/30";
}

export function FinanceInsightsPanel({
  headline,
  insights,
}: {
  headline: string;
  insights: Insight[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">AI summary</div>
        <div className="mt-2 text-sm text-muted-foreground">{headline}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((x) => (
          <div key={x.title} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">{x.title}</div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${pill(x.severity)}`}>
                {x.severity.toUpperCase()}
              </span>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">{x.narrative}</div>

            {x.bullets?.length ? (
              <ul className="mt-3 space-y-1 text-sm text-foreground/90 list-disc pl-5">
                {x.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}