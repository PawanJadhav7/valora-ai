// app/lib/kpis/finance.ts

export type FinanceKpiKey =
  | "total_inflow"
  | "total_outflow"
  | "net_cash_flow"
  | "txn_count"
  | "avg_txn_amount"
  | "unique_accounts"
  | "fraud_rate"
  | "high_value_txn_share";

export type FinanceKpis = Record<FinanceKpiKey, number>;

type ValidateResult = {
  cols: string[];
  missing: string[];
  notes: string[];
};

function normKey(k: string) {
  return String(k || "").trim().toLowerCase();
}

function buildLowerKeyMap(row: any) {
  const m: Record<string, any> = {};
  for (const k of Object.keys(row ?? {})) m[normKey(k)] = row[k];
  return m;
}

/** Find a numeric value in a row by trying multiple column names */
function pickNumber(row: any, names: string[]): number {
  const m = buildLowerKeyMap(row);
  for (const n of names) {
    const key = normKey(n);
    if (key in m) {
      const v = m[key];

      // already number?
      if (typeof v === "number" && Number.isFinite(v)) return v;

      // strings like "$1,234.50"
      const s = String(v ?? "").replace(/[$,]/g, "").trim();
      const num = Number(s);
      if (Number.isFinite(num)) return num;
    }
  }
  return NaN;
}

/** Find a string value by trying multiple column names */
function pickString(row: any, names: string[]): string {
  const m = buildLowerKeyMap(row);
  for (const n of names) {
    const key = normKey(n);
    if (key in m) {
      const v = m[key];
      if (v == null) continue;
      return String(v).trim();
    }
  }
  return "";
}

/** Basic truthy parser for fraud flags like true/false, 1/0, yes/no, Y/N */
function parseBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y" || s === "fraud";
}

/**
 * ✅ Finance validation:
 * Minimum required to compute core finance KPIs:
 * - a numeric amount column
 * - an account identifier (account/customer)
 * - a transaction direction (type) OR we infer from sign of amount
 */
export function validateFinanceRows(rows: any[]): ValidateResult {
  const notes: string[] = [];
  const cols = Array.from(
    new Set(
      rows.flatMap((r) => Object.keys(r ?? {})).map((k) => String(k))
    )
  );

  // possible columns
  const amountCols = ["amount", "txn_amount", "transaction_amount", "value", "net_amount"];
  const acctCols = ["account_id", "accountid", "customer_id", "customerid", "client_id"];
  const typeCols = ["transaction_type", "txn_type", "type", "direction", "dr_cr"];

  const first = rows?.[0] ?? {};
  const lm = Object.keys(first).reduce((acc: Record<string, true>, k) => {
    acc[normKey(k)] = true;
    return acc;
  }, {});

  const hasAny = (names: string[]) => names.some((n) => lm[normKey(n)]);
  const missing: string[] = [];

  if (!hasAny(amountCols)) missing.push("amount");
  if (!hasAny(acctCols)) missing.push("account_id (or customer_id)");
  if (!hasAny(typeCols)) {
    notes.push("No transaction_type column found — inflow/outflow will be inferred from sign of amount (+/-).");
  }

  // fraud KPI optional
  if (!hasAny(["is_fraud", "fraud_flag", "fraud", "flag_fraud"])) {
    notes.push("No fraud flag column found — fraud_rate will be 0 (or based on 'fraud_rule' if present).");
  }

  // high-value KPI threshold
  notes.push("High-value transactions are defined as amount >= 10,000 (you can change this threshold).");

  return { cols, missing, notes };
}

/**
 * ✅ Compute 8 Finance KPIs from rows
 * Works with flexible columns:
 * amount: amount/txn_amount/value...
 * type: transaction_type / type / direction / dr_cr (Credit/Debit)
 * account: account_id/customer_id...
 * fraud: is_fraud/fraud_flag OR infer if fraud_rule exists
 */
export function computeFinanceKPIs(rows: any[]): FinanceKpis {
  const amountCols = ["amount", "txn_amount", "transaction_amount", "value", "net_amount"];
  const acctCols = ["account_id", "accountid", "customer_id", "customerid", "client_id"];
  const typeCols = ["transaction_type", "txn_type", "type", "direction", "dr_cr"];
  const fraudCols = ["is_fraud", "fraud_flag", "fraud", "flag_fraud"];
  const fraudRuleCols = ["fraud_rule", "rule", "fraud_reason"];

  const HIGH_VALUE = 10000;

  let inflow = 0;
  let outflow = 0;

  let txnCount = 0;
  let sumAbsAmount = 0;

  let fraudCount = 0;

  let highValueCount = 0;

  const acctSet = new Set<string>();

  for (const row of rows ?? []) {
    const amtRaw = pickNumber(row, amountCols);
    if (!Number.isFinite(amtRaw)) continue;

    const amt = Number(amtRaw);
    const absAmt = Math.abs(amt);

    // account uniqueness
    const acct = pickString(row, acctCols);
    if (acct) acctSet.add(acct);

    // classify inflow/outflow
    const t = pickString(row, typeCols).toLowerCase();
    const looksCredit =
      t.includes("credit") || t.includes("cr") || t.includes("in") || t.includes("deposit") || t.includes("income")|| t.includes("in")|| t.includes("inflow");
    const looksDebit =
      t.includes("debit") || t.includes("dr") || t.includes("out") || t.includes("withdraw") || t.includes("expense")|| t.includes("outflow");

    if (looksCredit) inflow += absAmt;
    else if (looksDebit) outflow += absAmt;
    else {
      // infer from sign (+ inflow, - outflow)
      if (amt >= 0) inflow += absAmt;
      else outflow += absAmt;
    }

    txnCount += 1;
    sumAbsAmount += absAmt;

    if (absAmt >= HIGH_VALUE) highValueCount += 1;

    // fraud (optional)
    const fraudVal = pickString(row, fraudCols);
    const hasFraudFlag = fraudVal !== "";
    const flag = hasFraudFlag ? parseBool(fraudVal) : false;

    // fallback: if fraud_rule exists and is non-empty, treat as suspicious/fraud
    const fraudRule = pickString(row, fraudRuleCols).toLowerCase();
    const ruleFlag =
      fraudRule !== "" &&
      fraudRule !== "na" &&
      fraudRule !== "n/a" &&
      fraudRule !== "none" &&
      fraudRule !== "null" &&
      fraudRule !== "0";

    if (flag || ruleFlag) fraudCount += 1;
  }

  const net = inflow - outflow;
  const avgTxn = txnCount > 0 ? sumAbsAmount / txnCount : 0;
  const fraudRate = txnCount > 0 ? (fraudCount / txnCount) * 100 : 0;
  const highValueShare = txnCount > 0 ? (highValueCount / txnCount) * 100 : 0;

  return {
    total_inflow: inflow,
    total_outflow: outflow,
    net_cash_flow: net,
    txn_count: txnCount,
    avg_txn_amount: avgTxn,
    unique_accounts: acctSet.size,
    fraud_rate: fraudRate,
    high_value_txn_share: highValueShare,
  };
}

/**
 * ✅ Optional helper: aggregate rows ONLY from datasets that are "Ready"
 * This matches your requirement: KPIs from total datasets uploaded with valid data.
 */
export function collectValidRowsForFinance(
  datasets: Record<string, { rows: any[]; issues?: { missing?: string[] } }>
) {
  const all: any[] = [];
  for (const ds of Object.values(datasets ?? {})) {
    const missing = ds?.issues?.missing ?? [];
    const ready = missing.length === 0;
    if (!ready) continue;
    all.push(...(ds.rows ?? []));
  }
  return all;
}