// app/lib/insights/crossDomainEngine.ts

export type Severity = "Low" | "Medium" | "High";
export type InsightCls = "emerald" | "amber" | "rose" | "slate";
export type Priority = "low" | "medium" | "high";

export type CrossDomainInsight = {
  id: string;
  severity: Severity;
  priority: Priority;          // ✅ now matches "high|medium|low"
  cls: InsightCls;

  domains: string[];
  title: string;

  message: string;             // ✅ main “body” text shown in UI
  explanation: string;         // ✅ why it matters
  recommended_action?: string;

  facts?: { label: string; value: string }[];
};

export type CrossDomainInputs = {
  finance?: any;
  saas?: any;
  supply?: any;
  healthcare?: any;
  insurance?: any;
  ecommerce?: any;
};

type Rule = (ctx: CrossDomainInputs) => CrossDomainInsight | null;


const sevRank: Record<Severity, number> = { Low: 1, Medium: 2, High: 3 };
const prRank: Record<Priority, number> = { low: 1, medium: 2, high: 3 };

function pickTop(insights: CrossDomainInsight[], n = 3) {
  return insights
    .slice()
    .sort(
      (a, b) =>
        sevRank[b.severity] - sevRank[a.severity] ||
        prRank[b.priority] - prRank[a.priority] ||
        a.title.localeCompare(b.title)
    )
    .slice(0, n);
}

function safeNum(x: any, fallback = 0) {
  const v = Number(x);
  return Number.isFinite(v) ? v : fallback;
}

/** ---------- Rules (v1) ---------- **/

const rules: Rule[] = [
  // 1) Growth under operational strain: SaaS + Supply
  
(ctx) => {
  const g = safeNum(ctx.saas?.mrr_growth_rate, 0);
  const onTime = safeNum(ctx.supply?.on_time_delivery_rate, 100);
  const delayRate = safeNum(ctx.supply?.delay_rate, 0);

  if (g >= 5 && onTime < 85) {
    return {
      id: "saas_supply_growth_strain",
      severity: "High",
      priority: "high",
      cls: "rose",
      domains: ["SaaS", "Supply Chain"],
      title: "Growth under operational strain",

      message: `MRR growth is strong (${g.toFixed(2)}%), but on-time delivery is weak (${onTime.toFixed(
        1
      )}%).`,

      explanation:
        "Scaling demand without stabilizing delivery can raise churn, refunds, and support burden.",

      recommended_action:
        "Stabilize fulfillment (on-time delivery and delay rate) before pushing more acquisition or upsells.",

      facts: [
        { label: "MRR growth", value: `${g.toFixed(2)}%` },
        { label: "On-time", value: `${onTime.toFixed(1)}%` },
        { label: "Late rate", value: `${delayRate.toFixed(1)}%` },
      ],
    };
  }
  return null;
},

  // 2) Cash stress + denial pressure: Finance + Healthcare
(ctx) => {
  const netCash = safeNum(ctx.finance?.net_cash_flow, 0);
  const denial = safeNum(ctx.healthcare?.denial_rate, 0);
  const paidToCharge = safeNum(ctx.healthcare?.paid_to_charge_pct, 0); // optional if you have it

  if (netCash < 0 && denial >= 12) {
    return {
      id: "finance_health_denial_cash_stress",
      severity: "High",
      priority: "high",
      cls: "rose",
      domains: ["Finance", "Healthcare"],
      title: "Denials likely impacting liquidity",

      message: `Net cash flow is negative (${netCash.toFixed(
        0
      )}), while denial rate is elevated (${denial.toFixed(1)}%).`,

      explanation:
        "Negative cash flow alongside elevated denial rate suggests revenue leakage may be tightening cash availability.",

      recommended_action:
        "Prioritize denial reduction (coding, eligibility, documentation) and track paid-to-charge weekly.",

      facts: [
        { label: "Net cash flow", value: `${netCash.toFixed(0)}` },
        { label: "Denial rate", value: `${denial.toFixed(1)}%` },
        ...(paidToCharge > 0 ? [{ label: "Paid/Charged", value: `${paidToCharge.toFixed(1)}%` }] : []),
      ],
    };
  }
  return null;
},
// 3) Concentration risk: Ecommerce + Finance (top customers)
(ctx) => {
  const top10 = safeNum(ctx.ecommerce?.top10_customer_share ?? ctx.ecommerce?.top10_revenue_share, 0);
  const netCash = safeNum(ctx.finance?.net_cash_flow, 0);

  if (top10 >= 50 && netCash < 0) {
    return {
      id: "ecom_finance_concentration_cash",
      severity: "Medium",
      priority: "medium",
      cls: "amber",
      domains: ["Ecommerce", "Finance"],
      title: "High concentration + cash pressure",

      message: `Top-10 customers drive ${top10.toFixed(
        1
      )}% of revenue while net cash flow is negative.`,

      explanation:
        "A large share of revenue comes from a small customer set while cash flow is negative. A single customer churn could worsen liquidity.",

      recommended_action:
        "Diversify revenue mix and monitor top-customer cohort retention and payment timing.",

      facts: [
        { label: "Top-10 share", value: `${top10.toFixed(1)}%` },
        { label: "Net cash flow", value: `${netCash.toFixed(0)}` },
      ],
    };
  }
  return null;
},

// 4) High-loss environment: Insurance + Finance
(ctx) => {
  const loss = safeNum(ctx.insurance?.loss_ratio, 0);
  const netCash = safeNum(ctx.finance?.net_cash_flow, 0);

  if (loss >= 80 && netCash < 0) {
    return {
      id: "insurance_finance_loss_cash",
      severity: "High",
      priority: "high",
      cls: "rose",
      domains: ["Insurance", "Finance"],
      title: "Claims pressure + negative cash flow",

      message: `Loss ratio is high (${loss.toFixed(1)}%) and net cash flow is negative.`,

      explanation:
        "High loss ratio combined with negative net cash flow can create a compounding stress loop (more payouts, less liquidity).",

      recommended_action:
        "Review claim severity drivers and re-check premium adequacy / reserves assumptions.",

      facts: [
        { label: "Loss ratio", value: `${loss.toFixed(1)}%` },
        { label: "Net cash flow", value: `${netCash.toFixed(0)}` },
      ],
    };
  }
  return null;
},

// 5) SaaS NRR risk (standalone but important)
(ctx) => {
  const expansion = safeNum(ctx.saas?.expansion_rate, 0);
  const contraction = safeNum(ctx.saas?.contraction_rate, 0);
  const churn = safeNum(ctx.saas?.customer_churn_rate, 0);
  const nrr = 100 + expansion - contraction - churn;

  if (nrr < 95) {
    return {
      id: "saas_nrr_at_risk",
      severity: "High",
      priority: "high",
      cls: "rose",
      domains: ["SaaS"],
      title: "Net revenue retention at risk",

      message: `NRR is ${nrr.toFixed(1)}% (expansion ${expansion.toFixed(1)}%, contraction ${contraction.toFixed(
        1
      )}%, churn ${churn.toFixed(1)}%).`,

      explanation:
        "NRR below healthy levels indicates churn + contraction outweigh expansion. Growth may be fragile without retention fixes.",

      recommended_action:
        "Identify churn drivers, tighten onboarding, and target expansion from healthiest cohorts.",

      facts: [
        { label: "NRR", value: `${nrr.toFixed(1)}%` },
        { label: "Expansion", value: `${expansion.toFixed(1)}%` },
        { label: "Contraction", value: `${contraction.toFixed(1)}%` },
        { label: "Churn", value: `${churn.toFixed(1)}%` },
      ],
    };
  }
  return null;
},

  // 6) Detects when supply chain delivery delays are likely contributing to increased SaaS churn.
(ctx) => {
  const supply = ctx?.supply;
  const saas = ctx?.saas;
  if (!supply || !saas) return null;

  const avgDelay = safeNum(supply.avg_delay_days, 0);
  const delayRate = safeNum(supply.delay_rate, 0);
  const onTime = safeNum(supply.on_time_delivery_rate, 0);

  const churn = safeNum(saas.customer_churn_rate, 0);
  const mrrGrowth = safeNum(saas.mrr_growth_rate, 0);

  // gate (avoid noise)
  if (!(avgDelay >= 2 && delayRate >= 10 && churn >= 3)) return null;

  const high = avgDelay >= 4 || (delayRate >= 20 && churn >= 5);

  return {
    id: "supply_saas_delay_churn_v1",
    severity: high ? "High" : "Medium",
    priority: high ? "high" : "medium",
    cls: high ? "rose" : "amber",
    domains: ["Supply Chain", "SaaS"],
    title: high
      ? "Delivery delays likely driving churn risk"
      : "Watch: delivery delays may be impacting churn",

    message:
      `Supply Chain delays are elevated (avg ${avgDelay.toFixed(1)}d, ${delayRate.toFixed(1)}% late, ` +
      `${onTime.toFixed(1)}% on-time). SaaS churn is ${churn.toFixed(2)}%.` +
      (mrrGrowth < 0 ? ` MRR growth is declining (${mrrGrowth.toFixed(2)}%).` : ""),

    explanation:
      "When delivery reliability drops, customers experience friction that can increase churn and reduce expansion.",

    recommended_action:
      "Prioritize delay reduction (top lanes/carriers/SKUs), then monitor churn by cohort for 2–4 weeks.",

    facts: [
      { label: "Avg delay", value: `${avgDelay.toFixed(1)}d` },
      { label: "Late rate", value: `${delayRate.toFixed(1)}%` },
      { label: "On-time", value: `${onTime.toFixed(1)}%` },
      { label: "Churn", value: `${churn.toFixed(2)}%` },
    ],
  };
},
  
];
// Cross-domain rule that generates an insight when a high-impact condition across domains is detected.
export function computeCrossDomainInsights(ctx: CrossDomainInputs, opts?: { limit?: number }) {
  const insights = rules.map((r) => r(ctx)).filter(Boolean) as CrossDomainInsight[];
  return {
    all: insights,
    top: pickTop(insights, opts?.limit ?? 3),
  };
}