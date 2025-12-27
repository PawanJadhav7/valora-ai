export type InsightSeverity = "good" | "warn" | "risk";

export type FinanceInsight = {
  id: string;
  title: string;
  severity: InsightSeverity;
  body: string;
  cta?: string;
};

export type FinanceInputs = {
  inflow: number;
  outflow: number;
  net: number;
};

export function money(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function buildFinanceInsights({ inflow, outflow, net }: FinanceInputs): FinanceInsight[] {
  const insights: FinanceInsight[] = [];

  const netPct = inflow > 0 ? net / inflow : 0;
  const outflowPct = inflow > 0 ? outflow / inflow : 0;

  // 1) Net cash health
  if (inflow <= 0 && outflow > 0) {
    insights.push({
      id: "no-inflow",
      title: "No inflows detected",
      severity: "risk",
      body: `You had ${money(outflow)} in outflows with no inflows in the last 30 days. Check revenue feeds and bank/Stripe ingestion.`,
      cta: "Verify data sources & ingestion",
    });
  } else if (net < 0) {
    insights.push({
      id: "negative-net",
      title: "Cash burn (net negative)",
      severity: "risk",
      body: `Net cash flow is ${money(net)}. Outflows (${money(outflow)}) are exceeding inflows (${money(inflow)}).`,
      cta: "Review top expense categories and timing",
    });
  } else if (netPct < 0.05) {
    insights.push({
      id: "thin-net",
      title: "Thin cash cushion",
      severity: "warn",
      body: `Net cash is ${money(net)} (${(netPct * 100).toFixed(1)}% of inflow). You’re close to breakeven—watch expenses and collections.`,
      cta: "Tighten spend + accelerate receivables",
    });
  } else {
    insights.push({
      id: "healthy-net",
      title: "Healthy net cash position",
      severity: "good",
      body: `Net cash is ${money(net)} (${(netPct * 100).toFixed(1)}% of inflow). Your operating cash position looks solid.`,
      cta: "Consider reinvesting into growth or reserves",
    });
  }

  // 2) Expense pressure
  if (inflow > 0 && outflowPct >= 0.95) {
    insights.push({
      id: "high-expense-pressure",
      title: "High expense pressure",
      severity: net < 0 ? "risk" : "warn",
      body: `Outflows are ${(outflowPct * 100).toFixed(0)}% of inflow. Identify recurring costs and largest vendors driving spend.`,
      cta: "Audit recurring charges + vendor costs",
    });
  }

  // 3) Simple cash runway hint (very basic)
  if (net < 0 && outflow > 0) {
    const burn = Math.abs(net);
    insights.push({
      id: "burn-rate",
      title: "Estimated burn rate",
      severity: "warn",
      body: `Approx burn is ${money(burn)} over 30 days (~${money(burn / 30)}/day).`,
      cta: "Track burn trend weekly",
    });
  }

  return insights;
}