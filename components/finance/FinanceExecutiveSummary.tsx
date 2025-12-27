"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

export type Severity = "good" | "warn" | "risk";

function severityStyles(sev: Severity) {
  switch (sev) {
    case "good":
      return {
        icon: CheckCircle2,
        cls: "text-success",
        badge: "bg-success/10 text-success border-success/20",
      };
    case "warn":
      return {
        icon: AlertTriangle,
        cls: "text-amber-400",
        badge: "bg-amber-400/10 text-amber-300 border-amber-400/20",
      };
    case "risk":
    default:
      return {
        icon: XCircle,
        cls: "text-danger",
        badge: "bg-danger/10 text-danger border-danger/20",
      };
  }
}

export type ExecSignal = {
  label: string;
  value: string;
  severity?: Severity; // ✅ optional (defaults to "warn")
};

export type ExecCallout = {
  severity?: Severity; // ✅ optional (defaults to "warn")
  label: string;
  value: string;
  href?: string;
};

export function FinanceExecutiveSummary(props: {
  headline: string;
  signals: ExecSignal[];
  callout?: ExecCallout | null;
  actions: string[];
  basedOn?: string; // e.g. "Based on last 30 days"
  refreshedAt?: string; // ISO string
}) {
  const refreshed = props.refreshedAt ? new Date(props.refreshedAt) : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">
            Executive summary
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            {props.headline}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span>{props.basedOn ?? "Based on last 30 days"}</span>
            <span className="opacity-50">•</span>
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              {refreshed ? `Refreshed ${refreshed.toLocaleString()}` : "Refreshed just now"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {props.signals.map((s) => {
          const sev = s.severity ?? "warn";
          const { icon: Icon, cls, badge } = severityStyles(sev);

          return (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-background/40 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{s.label}</div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${badge}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${cls}`} />
                  {sev.toUpperCase()}
                </span>
              </div>

              <div className="mt-2 text-2xl font-semibold text-foreground">
                {s.value}
              </div>
            </div>
          );
        })}
      </div>

      {props.callout && (
        <div className="mt-3 rounded-2xl border border-border bg-background/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-xs text-muted-foreground">{props.callout.label}</div>

            {/* ✅ optional severity badge on callout */}
            <span className="shrink-0">
              {(() => {
                const sev = props.callout?.severity ?? "warn";
                const { icon: Icon, cls, badge } = severityStyles(sev);
                return (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${badge}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${cls}`} />
                    {sev.toUpperCase()}
                  </span>
                );
              })()}
            </span>
          </div>

          {props.callout.href ? (
            <Link
              href={props.callout.href}
              className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
            >
              {props.callout.value}
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ) : (
            <div className="mt-1 text-sm font-semibold text-foreground">
              {props.callout.value}
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <div className="text-sm font-semibold text-foreground">Next actions</div>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
          {props.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}