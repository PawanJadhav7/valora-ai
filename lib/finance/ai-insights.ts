import { money } from "@/lib/format";

export type FinanceKpis30d = {
  inflow30: number;
  outflow30: number;
  net30: number;
};

export type CashflowPoint = {
  day: string; // YYYY-MM-DD
  inflow: number;
  outflow: number;
  net: number;
};

export type Insight = {
  title: string;
  severity: "good" | "warn" | "risk";
  narrative: string;
  bullets?: string[];
};

export type FinanceTopCategory30d = {
  category: string;
  inflow: number;
  outflow: number;
  net: number;
  txn_count: number;
};

export type FinanceTopCounterparty30d = {
  counterparty: string;
  inflow: number;
  outflow: number;
  net: number;
  txn_count: number;
};

function pct(n: number) {
  return `${n.toFixed(2)}%`;
}

export function buildFinanceAiInsights(args: {
  kpis: FinanceKpis30d;
  series: CashflowPoint[];
  topCategories30d: FinanceTopCategory30d[];
  topCounterparties30d: FinanceTopCounterparty30d[];
}): { headline: string; insights: Insight[] } {
  const { inflow30, outflow30, net30 } = args.kpis;

  const series = args.series ?? [];
  const cats = args.topCategories30d ?? [];
  const cps = args.topCounterparties30d ?? [];

  const safeInflow = inflow30 > 0 ? inflow30 : 0;
  const netPct = safeInflow > 0 ? (net30 / safeInflow) * 100 : 0;

  const posDays = series.filter((d) => d.net > 0).length;
  const negDays = series.filter((d) => d.net < 0).length;

  const biggestOutflow = [...series].sort((a, b) => b.outflow - a.outflow)[0];
  const biggestInflow = [...series].sort((a, b) => b.inflow - a.inflow)[0];

  const topOutflowCats = [...cats].sort((a, b) => b.outflow - a.outflow).slice(0, 3);
  const topInflowCats = [...cats].filter((c) => c.inflow > 0).sort((a, b) => b.inflow - a.inflow).slice(0, 3);

  const topOutflowCps = [...cps].sort((a, b) => b.outflow - a.outflow).slice(0, 3);
  const topInflowCps = [...cps].filter((c) => c.inflow > 0).sort((a, b) => b.inflow - a.inflow).slice(0, 3);

  const top1CpOutflow = topOutflowCps[0]?.outflow ?? 0;
  const cpConcentrationPct = outflow30 > 0 ? (top1CpOutflow / outflow30) * 100 : 0;

  const headline =
    net30 > 0
      ? `Cash position improved: net +${pct(netPct)} of inflow over the last 30 days.`
      : net30 < 0
      ? `Cash pressure: net is negative over the last 30 days.`
      : `Flat net cash flow over the last 30 days.`;

  const insights: Insight[] = [];

  // 1) Net health
  insights.push({
    title: "Net cash health (30d)",
    severity: net30 > 0 ? "good" : net30 < 0 ? "risk" : "warn",
    narrative:
      safeInflow > 0
        ? `Net cash flow is ${net30 >= 0 ? "positive" : "negative"} at ${pct(netPct)} of inflow.`
        : `Inflow is near zero, so net % signal is not meaningful yet.`,
    bullets: [
      `Inflow (30d): ${money(inflow30)}`,
      `Outflow (30d): ${money(outflow30)}`,
      `Net (30d): ${money(net30)}`,
    ],
  });

  // 2) Daily pattern
  insights.push({
    title: "Daily pattern signal",
    severity: negDays > posDays ? "warn" : "good",
    narrative:
      series.length > 0
        ? `You had ${posDays} positive-net days and ${negDays} negative-net days in the last 30 days.`
        : `Not enough daily data to compute pattern signals.`,
    bullets:
      series.length > 0
        ? [
            `Largest inflow day: ${biggestInflow?.day ?? "—"} (${biggestInflow ? money(biggestInflow.inflow) : "—"})`,
            `Largest outflow day: ${biggestOutflow?.day ?? "—"} (${biggestOutflow ? money(biggestOutflow.outflow) : "—"})`,
          ]
        : [],
  });

  // 3) Spend drivers (Categories)
  if (cats.length > 0) {
    const outflowDriverText =
      topOutflowCats.length > 0
        ? `Outflow is primarily driven by: ${topOutflowCats.map((c) => c.category).join(", ")}.`
        : `No category-level drivers detected yet.`;

    insights.push({
      title: "What is driving spend (categories)",
      severity: net30 < 0 ? "warn" : "good",
      narrative: outflowDriverText,
      bullets: [
        ...topOutflowCats.map(
          (c) =>
            `${c.category}: outflow ${money(c.outflow)} (${outflow30 > 0 ? pct((c.outflow / outflow30) * 100) : "—"} of outflow)`
        ),
        ...(topInflowCats.length
          ? [
              `Top inflow categories: ${topInflowCats
                .map((c) => `${c.category} (${money(c.inflow)})`)
                .join(", ")}`,
            ]
          : []),
      ],
    });
  }

  // 4) Counterparty drivers + concentration
  if (cps.length > 0) {
    const topCp = topOutflowCps[0];
    const concSeverity = cpConcentrationPct >= 40 ? "risk" : cpConcentrationPct >= 25 ? "warn" : "good";

    insights.push({
      title: "Where money is going (counterparties)",
      severity: concSeverity,
      narrative:
        topCp && outflow30 > 0
          ? `${topCp.counterparty} accounts for ${pct(cpConcentrationPct)} of outflow (concentration signal).`
          : `Counterparty concentration is not meaningful yet.`,
      bullets: [
        ...topOutflowCps.map(
          (c) => `${c.counterparty}: outflow ${money(c.outflow)} (${outflow30 > 0 ? pct((c.outflow / outflow30) * 100) : "—"})`
        ),
        ...(topInflowCps.length
          ? [
              `Top inflow counterparties: ${topInflowCps
                .map((c) => `${c.counterparty} (${money(c.inflow)})`)
                .join(", ")}`,
            ]
          : []),
      ],
    });
  }

  // 5) Driver to watch
  const daySpike = biggestOutflow && biggestOutflow.outflow > 0.35 * Math.max(1, outflow30);

  const riskDriver = daySpike
    ? `A single large outflow day (${biggestOutflow.day}) is driving a material portion of monthly spend. Check categories/counterparties for that date.`
    : cats.length || cps.length
    ? `Top drivers look stable; watch concentration in categories/counterparties if it grows.`
    : "Outflows look distributed; no single day dominates.";

  insights.push({
    title: "Driver to watch",
    severity: daySpike ? "risk" : "good",
    narrative: riskDriver,
    bullets:
      biggestOutflow
        ? [`Largest outflow day: ${biggestOutflow.day}`, `Outflow that day: ${money(biggestOutflow.outflow)}`]
        : [],
  });

  // 6) Next actions
  insights.push({
    title: "Recommended actions",
    severity: "warn",
    narrative: "Immediate actions based on current signals.",
    bullets: [
      "Validate category + counterparty tags for the top outflow drivers (accuracy improves insights).",
      "Review concentration: if a single counterparty > 25% of outflow, set an alert.",
      "Add anomaly rules: alert when daily outflow exceeds 2× last-14-day average.",
    ],
  });

  return { headline, insights };
}