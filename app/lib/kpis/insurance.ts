// app/lib/kpis/insurance.ts
// Claims-centric Insurance KPIs (client-side / demo-grade)

export type InsuranceKpis = {
  claims_count: number;
  total_claims: number;
  total_premium: number;

  avg_claim_amount: number;

  loss_ratio: number;              // (total_claims / total_premium) * 100
  open_claim_rate: number;         // (openCount / claimsCount) * 100
  fraud_rate: number;              // (fraudCount / claimsCount) * 100
  high_severity_share: number;     // (highSevCount / claimsCount) * 100

  unique_policies: number;
  policy_concentration_top10: number; // % of total_claims from top 10 policies
};

function pickValueCI(row: any, keys: string[]) {
  if (!row || typeof row !== "object") return undefined;
  const map: Record<string, any> = {};
  for (const k of Object.keys(row)) map[k.toLowerCase()] = (row as any)[k];
  for (const k of keys) {
    const v = map[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function pickNumber(row: any, keys: string[]) {
  const v = pickValueCI(row, keys);
  if (v === undefined) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function pickString(row: any, keys: string[]) {
  const v = pickValueCI(row, keys);
  return v === undefined ? "" : String(v).trim();
}

function parseBool(v: any): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return false;
  return s === "true" || s === "1" || s === "yes" || s === "y" || s === "t";
}

// ✅ Same idea as finance: only aggregate datasets that passed validation
export function collectValidRowsForInsurance(
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


export function computeInsuranceKPIs(rows: any[]): InsuranceKpis {
  const claimAmountCols = ["claim_amount", "amount", "paid_amount", "incurred_amount", "loss_amount", "value"];
  const premiumCols = ["premium", "written_premium", "earned_premium", "policy_premium"];
  const policyCols = ["policy_id", "policyid", "policy_number", "policynumber"];
  const statusCols = ["claim_status", "status", "claimstate"];
  const fraudCols = ["is_fraud", "fraud_flag", "fraud", "flag_fraud"];
  const fraudRuleCols = ["fraud_rule", "rule", "fraud_reason", "reason"];

  const HIGH_SEVERITY = 25000;

  let claimsCount = 0;
  let totalClaims = 0;
  let sumPremium = 0;

  let openCount = 0;
  let fraudCount = 0;
  let highSevCount = 0;

  const policySet = new Set<string>();
  const policyClaims = new Map<string, number>(); // ✅ for concentration

  for (const row of rows ?? []) {
    const amt = pickNumber(row, claimAmountCols);
    if (!Number.isFinite(amt)) continue;

    const absAmt = Math.abs(amt);
    claimsCount += 1;
    totalClaims += absAmt;

    const pol = pickString(row, policyCols) || "Unknown";
    policySet.add(pol);
    policyClaims.set(pol, (policyClaims.get(pol) ?? 0) + absAmt);

    const prem = pickNumber(row, premiumCols);
    if (Number.isFinite(prem) && prem > 0) sumPremium += prem;

    const st = pickString(row, statusCols).toLowerCase();
    const isOpen =
      st.includes("open") ||
      st.includes("pending") ||
      st.includes("in_review") ||
      st.includes("in review") ||
      st.includes("wip") ||
      st.includes("investig");
    if (isOpen) openCount += 1;

    const fraudVal = pickString(row, fraudCols);
    const flag = fraudVal !== "" ? parseBool(fraudVal) : false;

    const fraudRule = pickString(row, fraudRuleCols);
    const ruleFlag = fraudRule.length > 0;

    if (flag || ruleFlag) fraudCount += 1;

    if (absAmt >= HIGH_SEVERITY) highSevCount += 1;
  }

  const avgClaim = claimsCount > 0 ? totalClaims / claimsCount : 0;
  const lossRatio = sumPremium > 0 ? (totalClaims / sumPremium) * 100 : 0;
  const openRate = claimsCount > 0 ? (openCount / claimsCount) * 100 : 0;
  const fraudRate = claimsCount > 0 ? (fraudCount / claimsCount) * 100 : 0;
  const highSevShare = claimsCount > 0 ? (highSevCount / claimsCount) * 100 : 0;

  let top10PolicyShare = 0;
  if (totalClaims > 0 && policyClaims.size > 0) {
    const sorted = Array.from(policyClaims.values()).sort((a, b) => b - a);
    const top10 = sorted.slice(0, 10).reduce((s, v) => s + v, 0);
    top10PolicyShare = (top10 / totalClaims) * 100;
  }

  return {
    claims_count: claimsCount,
    total_claims: totalClaims,
    total_premium: sumPremium,

    avg_claim_amount: avgClaim,

    loss_ratio: lossRatio,
    open_claim_rate: openRate,
    fraud_rate: fraudRate,
    high_severity_share: highSevShare,

    unique_policies: policySet.size,
    policy_concentration_top10: top10PolicyShare,
  };
}

// app/lib/kpis/insurance.ts

export function validateInsuranceRows(rows: any[]) {
  const cols = Object.keys((rows?.[0] ?? {}) as any).map((c) =>
    String(c || "").trim().toLowerCase().replace(/\s+/g, "_")
  );

  const set = new Set(cols);
  const hasAny = (aliases: string[]) =>
    aliases.some((a) => set.has(String(a).trim().toLowerCase().replace(/\s+/g, "_")));

  const missing: string[] = [];

  if (!hasAny(["claim_amount", "amount", "paid_amount", "incurred_amount", "loss_amount", "value"]))
    missing.push("Claim amount");
  if (!hasAny(["policy_id", "policyid", "policy_number", "policynumber"]))
    missing.push("Policy ID");

  const notes: string[] = [];
  if (missing.length > 0) {
    notes.push(`Missing: ${missing.join(", ")}.`);
    notes.push("Include claim_amount + policy_id to activate Insurance KPIs.");
    notes.push("Optional: premium, claim_status, is_fraud / fraud_rule.");
  }

  return { cols, missing, notes, domainTitle: "Insurance" };
}