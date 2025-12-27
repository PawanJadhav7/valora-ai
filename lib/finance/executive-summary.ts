import { money } from "@/lib/format";

export type FinanceKpis30d = { inflow30: number; outflow30: number; net30: number };
export type CashflowPoint = { day: string; inflow: number; outflow: number; net: number };

export type Signal = { label: string; value: string; driver?: string; severity: "good" | "warn" | "risk"; href?: string };
export type Callout = { severity: "good" | "warn" | "risk"; title: string; body: string; href?: string };

export function buildFinanceExecutiveSummary(args: {
  kpis: FinanceKpis30d;
  daily: CashflowPoint[];
  topCategories30d: Array<{ category: string; inflow: number; outflow: number; net: number; txn_count: number }>;
  topCounterparties30d: Array<{ counterparty: string; inflow: number; outflow: number; net: number; txn_count: number }>;
  generatedAt?: string; // ✅ optional (pass from /api/finance/insights)
}) {
  const { inflow30, outflow30, net30 } = args.kpis;

  const topCat = [...(args.topCategories30d ?? [])].sort((a, b) => b.outflow - a.outflow)[0];
  const topCp = [...(args.topCounterparties30d ?? [])].sort((a, b) => b.outflow - a.outflow)[0];

  const netPct = inflow30 > 0 ? (net30 / inflow30) * 100 : 0;

  const headline =
    net30 > 0
      ? `Net positive over 30 days (${netPct.toFixed(1)}% of inflow).`
      : net30 < 0
      ? `Net negative over 30 days (cash pressure).`
      : `Net flat over 30 days.`;

  // ✅ severity helper
  const overallSeverity: "good" | "warn" | "risk" = net30 > 0 ? "good" : net30 < 0 ? "risk" : "warn";

  // ✅ signal severities (simple + useful)
  const netSeverity: "good" | "warn" | "risk" = overallSeverity;

  const catSharePct =
    outflow30 > 0 && topCat?.outflow ? (topCat.outflow / outflow30) * 100 : 0;
  const catSeverity: "good" | "warn" | "risk" =
    catSharePct >= 40 ? "risk" : catSharePct >= 25 ? "warn" : "good";

  const cpSharePct =
    outflow30 > 0 && topCp?.outflow ? (topCp.outflow / outflow30) * 100 : 0;
  const cpSeverity: "good" | "warn" | "risk" =
    cpSharePct >= 40 ? "risk" : cpSharePct >= 25 ? "warn" : "good";

  // ✅ clickable routes (go to Expenses with query params)
  const catHref = topCat?.category
    ? `/finance/expenses?category=${encodeURIComponent(topCat.category)}`
    : undefined;

  const cpHref = topCp?.counterparty
    ? `/finance/expenses?counterparty=${encodeURIComponent(topCp.counterparty)}`
    : undefined;

  // ✅ your signals now include severity + optional href
  const signals = [
    {
      label: "Net (30d)",
      value: money(net30),
      driver: inflow30 > 0 ? `Net ${netPct.toFixed(1)}% of inflow` : "—",
      severity: netSeverity,
    },
    {
      label: "Top spend category",
      value: topCat ? topCat.category : "—",
      driver: topCat ? `${money(topCat.outflow)} (${catSharePct.toFixed(1)}% of outflow)` : "—",
      severity: catSeverity,
      href: catHref,
    },
    {
      label: "Top counterparty",
      value: topCp ? topCp.counterparty : "—",
      driver: topCp ? `${money(topCp.outflow)} (${cpSharePct.toFixed(1)}% of outflow)` : "—",
      severity: cpSeverity,
      href: cpHref,
    },
  ];

  // ✅ callout unchanged, but you can keep using severity in UI
  const callout: Callout = net30 > 0
  ? {
      severity: "good",
      label: "Overall signal",
      value: "Cash improving — review spend concentration",
      href: "/finance/expenses",
    }
  : net30 < 0
  ? {
      severity: "risk",
      label: "Overall signal",
      value: "Cash pressure — check liquidity + anomalies",
      href: "/finance/liquidity",
    }
  : {
      severity: "warn",
      label: "Overall signal",
      value: "Net flat — tighten recurring spend",
      href: "/finance/expenses",
    };

  const actions = [
    "Review top spend category and confirm tagging is correct.",
    "Review top counterparty and validate recurring/one-off payments.",
    "Investigate the largest outflow day and the transactions behind it.",
  ];

  // ✅ include generatedAt so header can show “Refreshed …”
  return { headline, signals, callout, actions, generatedAt: args.generatedAt ?? null };
}