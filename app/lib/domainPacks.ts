// app/lib/domainPacks.ts
export type ChartPoint = { label: string; revenue: number };

export type Insight = { title: string; body: string };

export type PackKpi = {
  label: string;
  value: number; // raw numeric value (dashboard will format)
  hint?: string;
  positive?: boolean;
  format?: "currency" | "number" | "percent";
};

function safeNumber(x: any): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function pickValueCI(row: any, names: string[]) {
  const lowerMap: Record<string, any> = {};
  for (const k of Object.keys(row ?? {})) lowerMap[k.toLowerCase()] = row[k];
  for (const n of names) {
    const v = lowerMap[n.toLowerCase()];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

export function extractNumberCI(row: any, names: string[]) {
  const v = pickValueCI(row, names);
  if (v === null) return 0;
  return safeNumber(v);
}

export function extractStringCI(row: any, names: string[]) {
  const v = pickValueCI(row, names);
  if (v === null) return "";
  return String(v);
}

export function extractDateCI(row: any, names: string[]): Date | null {
  const v = pickValueCI(row, names);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function lastNDays(ref: Date, d: Date, n: number) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = (ref.getTime() - d.getTime()) / msPerDay;
  return diff >= 0 && diff <= n;
}

export function buildMonthlySeries(
  rows: any[],
  metricNames: string[],
  dateNames: string[],
  lastN: number = 6
): ChartPoint[] {
  const monthly = new Map<string, number>();

  for (const row of rows) {
    const metric = extractNumberCI(row, metricNames);
    if (metric <= 0) continue;
    const d = extractDateCI(row, dateNames);
    if (!d) continue;
    const key = monthKey(d);
    monthly.set(key, (monthly.get(key) ?? 0) + metric);
  }

  const entries = Array.from(monthly.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const slice = entries.slice(-lastN);

  return slice.map(([k, v]) => ({ label: monthLabel(k), revenue: v }));
}

export type DomainPackResult = {
  packName: string;
  kpis: PackKpi[];
  chartLabel: string;
  chartPoints: ChartPoint[];
  insights: Insight[];
  missingHint?: string; // shown when required fields are missing
};

export function computeDomainPack(domain: string, rows: any[]): DomainPackResult {
  const d = (domain || "").toLowerCase();

  const commonDate = ["date", "order_date", "orderdate", "invoice_date", "event_date", "created_at", "timestamp"];
  const commonCustomer = ["customer_id", "customerid", "customer", "account_id", "accountid", "user_id", "userid"];
  const commonAmount = ["revenue", "amount", "sales", "total", "netrevenue", "premium", "charge_amount", "paid_amount", "claim_amount", "cost"];

  const hasRows = rows?.length > 0;

  // Helper: find max date in dataset (for recency metrics)
  let maxDate: Date | null = null;
  if (hasRows) {
    for (const row of rows) {
      const dt = extractDateCI(row, commonDate);
      if (dt && (!maxDate || dt > maxDate)) maxDate = dt;
    }
  }
  const refDate = maxDate ?? new Date();

  // ---- SAAS PACK ----
  if (d.includes("saas")) {
    const mrrNames = ["mrr", "monthly_recurring_revenue", "recurring_revenue", "monthly_revenue"];
    const statusNames = ["status", "subscription_status", "state"];
    const subIdNames = ["subscription_id", "subscriptionid", "sub_id"];

    let totalMRR = 0;
    const activeCustomers = new Set<string>();
    const churnedCustomers = new Set<string>();
    let recentMRR = 0;

    for (const row of rows) {
      const mrr = extractNumberCI(row, mrrNames);
      const amountFallback = extractNumberCI(row, commonAmount);
      const metric = mrr > 0 ? mrr : amountFallback;

      const cust = extractStringCI(row, commonCustomer);
      const st = extractStringCI(row, statusNames).toLowerCase();
      const dt = extractDateCI(row, commonDate);

      if (metric > 0) totalMRR += metric;

      if (cust) {
        // heuristic: status containing canceled/lapsed/churn => churn bucket
        if (st.includes("cancel") || st.includes("churn") || st.includes("lapse")) churnedCustomers.add(cust);
        else activeCustomers.add(cust);
      }

      if (dt && metric > 0 && lastNDays(refDate, dt, 30)) recentMRR += metric;
    }

    const arpa = activeCustomers.size > 0 ? totalMRR / activeCustomers.size : 0;
    const churnRate =
      activeCustomers.size + churnedCustomers.size > 0
        ? (churnedCustomers.size / (activeCustomers.size + churnedCustomers.size)) * 100
        : 0;

    const chartPoints = buildMonthlySeries(rows, mrrNames.concat(commonAmount), commonDate);

    const kpis: PackKpi[] = [
      { label: "Total MRR (proxy)", value: totalMRR, format: "currency", hint: "Uses mrr; falls back to amount" },
      { label: "Active customers", value: activeCustomers.size, format: "number", hint: "Distinct customer/account IDs" },
      { label: "ARPA (proxy)", value: arpa, format: "currency", hint: "MRR / active customers" },
      { label: "Churn (heuristic)", value: churnRate, format: "percent", hint: "Based on status contains cancel/churn/lapse", positive: churnRate < 10 },
      { label: "MRR last 30 days", value: recentMRR, format: "currency", hint: "Based on latest date in dataset" },
    ];

    const insights: Insight[] = [];
    if (!hasRows) {
      insights.push(
        { title: "Upload SaaS billing data", body: "Include mrr (or amount), date, and customer_id/account_id for accurate MRR, ARPA and churn signals." }
      );
    } else {
      insights.push(
        { title: "Revenue quality (MRR proxy)", body: `Your SaaS pack is estimating recurring revenue from available columns. If you include a true 'mrr' column, the results become much more accurate.` },
        { title: "Churn signal", body: `Churn is a heuristic based on status values (cancel/churn/lapse). Add subscription_status for better churn measurement.` }
      );
    }

    return {
      packName: "SaaS analytics pack",
      kpis,
      chartLabel: "MRR/Revenue trend by month",
      chartPoints,
      insights,
    };
  }

  // ---- FINANCE PACK ----
  if (d.includes("finance") || d.includes("bank")) {
    const typeNames = ["type", "txn_type", "transaction_type", "direction"];
    const amountNames = ["amount", "txn_amount", "value"].concat(commonAmount);
    const balanceNames = ["balance", "end_balance", "account_balance"];

    let inflow = 0;
    let outflow = 0;
    let netFlow30 = 0;
    const accounts = new Set<string>();
    let avgBalance = 0;
    let balanceCount = 0;

    for (const row of rows) {
      const amt = extractNumberCI(row, amountNames);
      const tp = extractStringCI(row, typeNames).toLowerCase();
      const dt = extractDateCI(row, commonDate);
      const acc = extractStringCI(row, ["account_id", "accountid", "customer_id", "customerid"]);

      if (acc) accounts.add(acc);

      // infer direction:
      const isOut =
        tp.includes("withdraw") || tp.includes("debit") || tp.includes("out") || tp.includes("payment");
      const isIn =
        tp.includes("deposit") || tp.includes("credit") || tp.includes("in") || tp.includes("refund");

      if (amt > 0) {
        if (isOut) outflow += amt;
        else if (isIn) inflow += amt;
        else {
          // if unknown, treat as inflow (safer for dashboards)
          inflow += amt;
        }
      }

      if (dt && amt > 0 && lastNDays(refDate, dt, 30)) {
        const signed = isOut ? -amt : amt;
        netFlow30 += signed;
      }

      const bal = extractNumberCI(row, balanceNames);
      if (bal > 0) {
        avgBalance += bal;
        balanceCount += 1;
      }
    }

    const netFlow = inflow - outflow;
    const avgBal = balanceCount > 0 ? avgBalance / balanceCount : 0;

    const chartPoints = buildMonthlySeries(rows, amountNames, commonDate);

    const kpis: PackKpi[] = [
      { label: "Gross inflow", value: inflow, format: "currency", hint: "Deposits/credits (heuristic)" },
      { label: "Gross outflow", value: outflow, format: "currency", hint: "Withdrawals/debits (heuristic)", positive: false },
      { label: "Net flow", value: netFlow, format: "currency", hint: "Inflow - outflow", positive: netFlow >= 0 },
      { label: "Net flow (last 30d)", value: netFlow30, format: "currency", hint: "Uses latest date in dataset", positive: netFlow30 >= 0 },
      { label: "Active accounts", value: accounts.size, format: "number", hint: "Distinct account/customer IDs" },
      { label: "Avg balance (if provided)", value: avgBal, format: "currency", hint: "Requires balance column" },
    ];

    const insights: Insight[] = [];
    if (!hasRows) {
      insights.push({ title: "Upload transactions", body: "Include date, amount, and transaction_type to compute inflows/outflows and net cash flow." });
    } else {
      insights.push(
        { title: "Cash flow snapshot", body: `Net flow is computed as inflow minus outflow. Add a clean 'transaction_type' field (deposit/withdrawal) for best accuracy.` },
        { title: "Balance enrichment", body: `If you add a balance column, Valora can estimate liquidity and trend it over time.` }
      );
    }

    return {
      packName: "Finance analytics pack",
      kpis,
      chartLabel: "Transaction volume trend by month",
      chartPoints,
      insights,
    };
  }

  // ---- INSURANCE PACK ----
  if (d.includes("insurance")) {
    const premiumNames = ["premium", "written_premium", "gross_premium", "amount"].concat(commonAmount);
    const claimNames = ["claim_amount", "paid_claim", "claims_paid", "loss"].concat(commonAmount);
    const policyNames = ["policy_id", "policyid", "policy_number", "policynumber"];
    const statusNames = ["status", "policy_status", "state"];
    const effDateNames = ["effective_date", "start_date", "policy_start", "date"].concat(commonDate);

    let totalPremium = 0;
    let totalClaims = 0;
    const policies = new Set<string>();
    let lapsed = 0;
    let recentPremium30 = 0;

    for (const row of rows) {
      const premium = extractNumberCI(row, premiumNames);
      const claim = extractNumberCI(row, claimNames);
      const policy = extractStringCI(row, policyNames);
      const status = extractStringCI(row, statusNames).toLowerCase();
      const dt = extractDateCI(row, effDateNames);

      if (policy) policies.add(policy);

      if (premium > 0) totalPremium += premium;
      if (claim > 0) totalClaims += claim;

      if (status.includes("lapse") || status.includes("cancel") || status.includes("expired")) lapsed += 1;

      if (dt && premium > 0 && lastNDays(refDate, dt, 30)) recentPremium30 += premium;
    }

    const lossRatio = totalPremium > 0 ? (totalClaims / totalPremium) * 100 : 0;
    const lapseRate = policies.size > 0 ? (lapsed / policies.size) * 100 : 0;

    const chartPoints = buildMonthlySeries(rows, premiumNames, effDateNames);

    const kpis: PackKpi[] = [
      { label: "Policies", value: policies.size, format: "number", hint: "Distinct policy IDs" },
      { label: "Written premium", value: totalPremium, format: "currency" },
      { label: "Claims paid (proxy)", value: totalClaims, format: "currency", positive: false },
      { label: "Loss ratio", value: lossRatio, format: "percent", positive: lossRatio < 60 },
      { label: "Lapse rate (heuristic)", value: lapseRate, format: "percent", positive: lapseRate < 10 },
      { label: "Premium (last 30d)", value: recentPremium30, format: "currency" },
    ];

    const insights: Insight[] = [];
    if (!hasRows) {
      insights.push({ title: "Upload policies + claims", body: "Include policy_id, premium, status, and claim_amount to compute loss ratio & lapse risk." });
    } else {
      insights.push(
        { title: "Portfolio health", body: `Loss ratio is claims divided by premium. If your claims are in a separate file, upload claims data too.` },
        { title: "Retention signal", body: `Lapse rate is a heuristic from status values. Normalize status values (active/canceled/lapsed) for accuracy.` }
      );
    }

    return {
      packName: "Insurance analytics pack",
      kpis,
      chartLabel: "Written premium trend by month",
      chartPoints,
      insights,
    };
  }

  // ---- HEALTHCARE PACK ----
  if (d.includes("healthcare")) {
    const chargeNames = ["charge_amount", "charges", "billed", "amount"].concat(commonAmount);
    const paidNames = ["paid_amount", "payments", "collected", "paid"].concat(commonAmount);
    const patientNames = ["patient_id", "patientid", "mrn", "member_id", "memberid"];
    const visitDateNames = ["visit_date", "service_date", "encounter_date", "date"].concat(commonDate);

    let totalCharges = 0;
    let totalPaid = 0;
    let visits = 0;
    const patients = new Set<string>();
    let recentCharges30 = 0;

    for (const row of rows) {
      const ch = extractNumberCI(row, chargeNames);
      const pd = extractNumberCI(row, paidNames);
      const pt = extractStringCI(row, patientNames);
      const dt = extractDateCI(row, visitDateNames);

      if (pt) patients.add(pt);
      if (ch > 0) totalCharges += ch;
      if (pd > 0) totalPaid += pd;

      if (dt) visits += 1;
      if (dt && ch > 0 && lastNDays(refDate, dt, 30)) recentCharges30 += ch;
    }

    const collectionRate = totalCharges > 0 ? (totalPaid / totalCharges) * 100 : 0;
    const avgChargePerVisit = visits > 0 ? totalCharges / visits : 0;

    const chartPoints = buildMonthlySeries(rows, chargeNames, visitDateNames);

    const kpis: PackKpi[] = [
      { label: "Total charges", value: totalCharges, format: "currency" },
      { label: "Total paid", value: totalPaid, format: "currency" },
      { label: "Collections rate", value: collectionRate, format: "percent", positive: collectionRate >= 80 },
      { label: "Unique patients", value: patients.size, format: "number" },
      { label: "Visits", value: visits, format: "number" },
      { label: "Avg charge / visit", value: avgChargePerVisit, format: "currency" },
      { label: "Charges (last 30d)", value: recentCharges30, format: "currency" },
    ];

    const insights: Insight[] = [];
    if (!hasRows) {
      insights.push({ title: "Upload encounters", body: "Include visit_date, patient_id, and charge_amount to compute volume & collections signals." });
    } else {
      insights.push(
        { title: "Revenue cycle signal", body: `Collections rate is paid / charges. If you include payer fields, we can segment collections by payer.` },
        { title: "Patient volume", body: `Unique patients and visits help track throughput. Add provider/location to drill down.` }
      );
    }

    return {
      packName: "Healthcare analytics pack",
      kpis,
      chartLabel: "Charges trend by month",
      chartPoints,
      insights,
    };
  }

  // ---- SUPPLY CHAIN PACK ----
  if (d.includes("supply")) {
    const shipDateNames = ["ship_date", "shipped_at", "dispatch_date", "date"].concat(commonDate);
    const deliveryDateNames = ["delivery_date", "delivered_at", "received_date"];
    const costNames = ["freight_cost", "shipping_cost", "cost", "amount"].concat(commonAmount);
    const shipmentNames = ["shipment_id", "shipmentid", "tracking_id", "trackingid", "order_id", "orderid"];

    let shipments = 0;
    const uniqShipments = new Set<string>();
    let totalCost = 0;
    let onTime = 0;
    let leadTimeSum = 0;
    let leadTimeCount = 0;

    for (const row of rows) {
      const shipId = extractStringCI(row, shipmentNames);
      const shipD = extractDateCI(row, shipDateNames);
      const delD = extractDateCI(row, deliveryDateNames);
      const cost = extractNumberCI(row, costNames);

      if (shipId) uniqShipments.add(shipId);
      shipments += 1;
      if (cost > 0) totalCost += cost;

      // On-time (heuristic): explicit flag or delivery within 7 days
      const flag = extractStringCI(row, ["on_time", "ontime", "status"]).toLowerCase();
      if (flag.includes("on") && flag.includes("time")) onTime += 1;
      else if (shipD && delD) {
        const days = (delD.getTime() - shipD.getTime()) / (1000 * 60 * 60 * 24);
        if (days <= 7) onTime += 1;
        if (days >= 0) {
          leadTimeSum += days;
          leadTimeCount += 1;
        }
      }
    }

    const onTimeRate = shipments > 0 ? (onTime / shipments) * 100 : 0;
    const avgLead = leadTimeCount > 0 ? leadTimeSum / leadTimeCount : 0;

    const chartPoints = buildMonthlySeries(rows, costNames, shipDateNames);

    const kpis: PackKpi[] = [
      { label: "Shipments", value: uniqShipments.size || shipments, format: "number" },
      { label: "Freight cost", value: totalCost, format: "currency", positive: false },
      { label: "On-time rate (heuristic)", value: onTimeRate, format: "percent", positive: onTimeRate >= 90 },
      { label: "Avg lead time (days)", value: avgLead, format: "number", hint: "Requires ship_date + delivery_date", positive: avgLead <= 7 },
    ];

    const insights: Insight[] = [];
    if (!hasRows) {
      insights.push({ title: "Upload shipments", body: "Include ship_date, delivery_date, and freight_cost to compute on-time and lead time metrics." });
    } else {
      insights.push(
        { title: "Delivery performance", body: `On-time is a heuristic. Add a clean on_time flag for accurate SLA measurement.` },
        { title: "Cost drivers", body: `Freight cost trend highlights logistics spend. Add carrier + zone to break down costs.` }
      );
    }

    return {
      packName: "Supply chain analytics pack",
      kpis,
      chartLabel: "Freight cost trend by month",
      chartPoints,
      insights,
    };
  }

  // Default
  return {
    packName: "General analytics pack",
    kpis: [],
    chartLabel: "Trend by month",
    chartPoints: [],
    insights: [
      { title: "Select a domain pack", body: "Choose a domain (E-commerce, SaaS, Finance, Insurance, Healthcare, Supply) to unlock specialized KPIs." },
    ],
    missingHint: "No domain pack matched.",
  };
}