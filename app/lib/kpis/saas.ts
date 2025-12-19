// app/lib/kpis/saas.ts

type ValidationResult = {
  cols: string[];
  missing: string[];
  notes: string[];
  domainTitle?: string;
};

function normalizeHeader(h: string) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getColumnsFromRows(rows: any[]): string[] {
  if (!rows || rows.length === 0) return [];
  return Object.keys(rows[0] ?? {}).map(normalizeHeader);
}

function hasAny(cols: string[], aliases: string[]) {
  const set = new Set(cols);
  return aliases.some((a) => set.has(normalizeHeader(a)));
}

function pickFirstValue(row: any, names: string[]) {
  if (!row) return undefined;
  const lowerMap: Record<string, any> = {};
  for (const k of Object.keys(row)) lowerMap[k.toLowerCase()] = row[k];

  for (const n of names) {
    const key = n.toLowerCase();
    if (key in lowerMap) return lowerMap[key];
  }
  return undefined;
}

function toNumber(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toDate(v: any): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Strict SaaS validation (used by dashboard readiness) */
export function validateSaaSRows(rows: any[]): ValidationResult {
  const cols = getColumnsFromRows(rows);

  const requiredAnyGroups = [
    { label: "Date", anyOf: ["date", "invoice_date", "event_date", "period_start"] },
    { label: "Customer", anyOf: ["customer_id", "account_id", "client_id"] },
    { label: "Amount (MRR/Revenue)", anyOf: ["mrr", "arr", "amount", "revenue", "net_amount"] },
  ];

  const missing: string[] = [];
  for (const g of requiredAnyGroups) {
    if (!hasAny(cols, g.anyOf)) missing.push(g.label);
  }

  const notes: string[] = [];
  if (missing.length > 0) {
    notes.push(`Missing: ${missing.join(", ")}.`);
    notes.push("One row per invoice / subscription event works best.");
    notes.push("Include date + customer_id + mrr/amount for best KPIs.");
    notes.push("Optional columns that unlock better insights: plan, status, event_type.");
  }

  return { cols, missing, notes, domainTitle: "SaaS & Subscription" };
}

/**
 * Collect all valid SaaS rows from all uploaded datasets.
 * “Valid” here means: validateSaaSRows(...) has no missing groups.
 */
export function collectValidRowsForSaaS(datasets: Record<string, any>): any[] {
  const all: any[] = [];
  for (const ds of Object.values(datasets || {})) {
    const rows = (ds as any)?.rows ?? [];
    if (!rows.length) continue;

    const v = validateSaaSRows(rows);
    if ((v.missing ?? []).length === 0) all.push(...rows);
  }
  return all;
}

export type SaaSKPIs = {
  // period context
  current_month: string | null;
  previous_month: string | null;

  // core
  mrr: number;
  active_customers: number;
  arpu: number;

  // churn
  churned_customers: number;
  customer_churn_rate: number; // %

  // revenue churn (lost + contraction)
  previous_mrr: number;
  churned_mrr: number;
  contraction_mrr: number;
  expansion_mrr: number;
  revenue_churn_rate: number; // %
  expansion_rate: number; // %
  mrr_growth_rate: number;
  contraction_rate: number;

  // risk
  top10_revenue_share: number; // %
};

export function computeSaaSKPIs(rows: any[]): SaaSKPIs {
  const empty: SaaSKPIs = {
    current_month: null,
    previous_month: null,
    mrr: 0,
    active_customers: 0,
    arpu: 0,
    churned_customers: 0,
    customer_churn_rate: 0,
    previous_mrr: 0,
    churned_mrr: 0,
    contraction_mrr: 0,
    expansion_mrr: 0,
    revenue_churn_rate: 0,
    expansion_rate: 0,
    mrr_growth_rate: 0,
    contraction_rate: 0,
    top10_revenue_share: 0,
  };

  if (!rows || rows.length === 0) return empty;

  // Extract (date, customer_id, amount) per row
  const parsed: Array<{ d: Date; m: string; cust: string; amt: number }> = [];
  let maxDate: Date | null = null;

  for (const r of rows) {
    const d =
      toDate(pickFirstValue(r, ["date", "invoice_date", "event_date", "period_start"])) ??
      toDate(pickFirstValue(r, ["created_at", "timestamp"]));
    if (!d) continue;

    const custRaw = pickFirstValue(r, ["customer_id", "account_id", "client_id", "customer"]);
    const cust = custRaw != null ? String(custRaw) : "";
    if (!cust) continue;

    // Prefer mrr, but accept amount/revenue
    const amt =
      toNumber(pickFirstValue(r, ["mrr"])) ||
      toNumber(pickFirstValue(r, ["arr"])) || // not perfect but fine for v1
      toNumber(pickFirstValue(r, ["amount", "revenue", "net_amount", "value"]));

    // allow 0s (important for events), but ignore NaN already handled
    const mk = monthKey(d);
    parsed.push({ d, m: mk, cust, amt });

    if (!maxDate || d > maxDate) maxDate = d;
  }

  if (!maxDate || parsed.length === 0) return empty;

  const currentMonth = monthKey(maxDate);
  const prevDate = new Date(maxDate.getFullYear(), maxDate.getMonth() - 1, 1);
  const prevMonth = monthKey(prevDate);

  // Aggregate to customer-month revenue
  const custMonth = new Map<string, number>(); // `${month}||${cust}` -> sum
  for (const p of parsed) {
    const key = `${p.m}||${p.cust}`;
    custMonth.set(key, (custMonth.get(key) ?? 0) + p.amt);
  }

  const currentCustMRR = new Map<string, number>();
  const prevCustMRR = new Map<string, number>();

  for (const [k, v] of custMonth.entries()) {
    const [m, cust] = k.split("||");
    if (m === currentMonth) currentCustMRR.set(cust, (currentCustMRR.get(cust) ?? 0) + v);
    if (m === prevMonth) prevCustMRR.set(cust, (prevCustMRR.get(cust) ?? 0) + v);
  }

  const mrr = Array.from(currentCustMRR.values()).reduce((a, b) => a + b, 0);
  const activeCustomers = currentCustMRR.size;
  const arpu = activeCustomers > 0 ? mrr / activeCustomers : 0;

  const previousMRR = Array.from(prevCustMRR.values()).reduce((a, b) => a + b, 0);
  const prevCustomers = prevCustMRR.size;

  // churned customers: in prev but not in current
  let churnedCustomers = 0;
  let churnedMRR = 0;
  let contractionMRR = 0;
  let expansionMRR = 0;

  for (const [cust, prevVal] of prevCustMRR.entries()) {
    const curVal = currentCustMRR.get(cust);

    if (curVal == null) {
      churnedCustomers += 1;
      churnedMRR += Math.max(0, prevVal);
    } else {
      const delta = curVal - prevVal;
      if (delta > 0) expansionMRR += delta;
      if (delta < 0) contractionMRR += Math.max(0, -delta);
    }
  }

  const customerChurnRate = prevCustomers > 0 ? (churnedCustomers / prevCustomers) * 100 : 0;
  const revenueChurnRate = previousMRR > 0 ? ((churnedMRR + contractionMRR) / previousMRR) * 100 : 0;
  const expansionRate = previousMRR > 0 ? (expansionMRR / previousMRR) * 100 : 0;

  // top-10 revenue share (current month)
  const top10Share = (() => {
    if (mrr <= 0) return 0;
    const arr = Array.from(currentCustMRR.entries()).sort((a, b) => b[1] - a[1]);
    const top = arr.slice(0, 10).reduce((s, [, v]) => s + v, 0);
    return (top / mrr) * 100;
  })();

  const mrrGrowthRate =
  previousMRR > 0 ? ((mrr - previousMRR) / previousMRR) * 100 : 0;

  const contractionRate =
  previousMRR > 0 ? (contractionMRR / previousMRR) * 100 : 0;

  return {
    current_month: currentMonth,
    previous_month: prevMonth,

    mrr,
    active_customers: activeCustomers,
    arpu,

    churned_customers: churnedCustomers,
    customer_churn_rate: customerChurnRate,

    previous_mrr: previousMRR,
    churned_mrr: churnedMRR,
    contraction_mrr: contractionMRR,
    expansion_mrr: expansionMRR,

    revenue_churn_rate: revenueChurnRate,
    expansion_rate: expansionRate,

    mrr_growth_rate: mrrGrowthRate,
    contraction_rate: contractionRate,

    top10_revenue_share: top10Share,
  };
}