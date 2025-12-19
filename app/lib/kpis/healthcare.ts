// app/lib/kpis/healthcare.ts
// Claims-centric Healthcare KPIs (client-side / demo-grade)
// Comment: D-5.1 — Adds Healthcare KPIs + strict validation + “only valid datasets” aggregator.

export type HealthcareKpis = {
  claims_count: number;
  total_paid: number;                // sum of paid_amount
  total_charged: number;             // sum of charge_amount
  avg_paid_per_claim: number;        // total_paid / claims_count
  denial_rate: number;               // % claims flagged denied
  high_cost_share: number;           // % claims >= HIGH_COST threshold (paid or charge)
  unique_patients: number;           // distinct patient_id/member_id
  provider_concentration_top10: number; // % of total_paid from top 10 providers
};

function pickValueCI(row: any, keys: string[]) {
  if (!row || typeof row !== "object") return undefined;
  const map: Record<string, any> = {};
  for (const k of Object.keys(row)) map[k.toLowerCase()] = row[k];
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

// ✅ Same idea as finance/insurance: only aggregate datasets that passed validation
export function collectValidRowsForHealthcare(
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

/**
 * Strict validator used by validation.ts
 * Required: (service date) + (patient/member id) + (paid OR charge)
 */
export function validateHealthcareRows(rows: any[]) {
  const cols = Object.keys((rows?.[0] ?? {}) as any).map((c) =>
    String(c || "").trim().toLowerCase().replace(/\s+/g, "_")
  );

  const set = new Set(cols);
  const hasAny = (aliases: string[]) =>
    aliases.some((a) => set.has(String(a).trim().toLowerCase().replace(/\s+/g, "_")));

  const missing: string[] = [];

  if (!hasAny(["service_date", "date_of_service", "dos", "claim_date", "date"]))
    missing.push("Service date");

  if (!hasAny(["patient_id", "member_id", "beneficiary_id", "patient", "member"]))
    missing.push("Patient / Member ID");

  if (!hasAny(["paid_amount", "payment_amount", "paid", "allowed_amount", "charge_amount", "billed_amount", "amount"]))
    missing.push("Paid or Charge amount");

  const notes: string[] = [];
  if (missing.length > 0) {
    notes.push(`Missing: ${missing.join(", ")}.`);
    notes.push("Include service_date + patient_id + paid_amount (or charge_amount) to activate Healthcare KPIs.");
    notes.push("Optional (recommended): provider_id to compute Top-10 provider share.");
    notes.push("Optional: denial_flag/status, diagnosis_code.");
  }

  return { cols, missing, notes, domainTitle: "Healthcare" };
}

export function computeHealthcareKPIs(rows: any[]): HealthcareKpis {
  const paidCols = ["paid_amount", "payment_amount", "paid", "allowed_amount", "net_paid"];
  const chargeCols = ["charge_amount", "billed_amount", "charges", "amount", "claim_amount"];
  const patientCols = ["patient_id", "member_id", "beneficiary_id", "patient", "member"];
  const providerCols = ["provider_id", "npi", "facility_id", "rendering_provider_id", "billing_provider_id"];
  const denialCols = ["is_denied", "denial_flag", "denied", "claim_denied"];
  const statusCols = ["claim_status", "status", "adjudication_status", "final_status"];

  // Demo realism; tune later or make percentile-based
  const HIGH_COST = 5000;

  let claimsCount = 0;
  let totalPaid = 0;
  let totalCharged = 0;

  let deniedCount = 0;
  let highCostCount = 0;

  const patientSet = new Set<string>();

  // provider paid aggregation for concentration
  const providerPaid = new Map<string, number>();

  for (const row of rows ?? []) {
    // choose a primary numeric measure for “valid claim”
    const paid = pickNumber(row, paidCols);
    const charged = pickNumber(row, chargeCols);

    const hasPaid = Number.isFinite(paid);
    const hasCharged = Number.isFinite(charged);

    if (!hasPaid && !hasCharged) continue; // skip junk rows

    claimsCount += 1;

    const paidVal = hasPaid ? Math.abs(Number(paid)) : 0;
    const chargeVal = hasCharged ? Math.abs(Number(charged)) : 0;

    totalPaid += paidVal;
    totalCharged += chargeVal;

    // patient uniqueness
    const pat = pickString(row, patientCols);
    if (pat) patientSet.add(pat);

    // denial
    const denialFlagRaw = pickString(row, denialCols);
    const hasDenialFlag = denialFlagRaw !== "";
    const deniedByFlag = hasDenialFlag ? parseBool(denialFlagRaw) : false;

    const st = pickString(row, statusCols).toLowerCase();
    const deniedByStatus =
      st.includes("deny") || st.includes("denied") || st.includes("rejected") || st.includes("reject");

    if (deniedByFlag || deniedByStatus) deniedCount += 1;

    // high cost share (use paid if present; else charge)
    const basis = paidVal > 0 ? paidVal : chargeVal;
    if (basis >= HIGH_COST) highCostCount += 1;

    // provider concentration (paid-based)
    const prov = pickString(row, providerCols);
    if (prov) providerPaid.set(prov, (providerPaid.get(prov) ?? 0) + paidVal);
  }

  const avgPaid = claimsCount > 0 ? totalPaid / claimsCount : 0;
  const denialRate = claimsCount > 0 ? (deniedCount / claimsCount) * 100 : 0;
  const highCostShare = claimsCount > 0 ? (highCostCount / claimsCount) * 100 : 0;

  // top10 provider concentration (% of totalPaid)
  let top10Share = 0;
  if (totalPaid > 0 && providerPaid.size > 0) {
    const sorted = Array.from(providerPaid.values()).sort((a, b) => b - a);
    const top10 = sorted.slice(0, 10).reduce((s, v) => s + v, 0);
    top10Share = (top10 / totalPaid) * 100;
  }

  return {
    claims_count: claimsCount,
    total_paid: totalPaid,
    total_charged: totalCharged,
    avg_paid_per_claim: avgPaid,
    denial_rate: denialRate,
    high_cost_share: highCostShare,
    unique_patients: patientSet.size,
    provider_concentration_top10: top10Share,
  };
}