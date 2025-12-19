// Supply Chain KPIs (D-6.1)
// Goal: be resilient to column name variations across CSV exports.

export type SupplyChainKPIs = {
  shipments_count: number;
  total_units: number;
  avg_units_per_shipment: number;
  on_time_delivery_rate: number;
  delay_rate: number;
  high_delay_share: number;
  unique_skus: number;
  unique_locations: number;
  avg_delay_days: number;
};

export const SUPPLYCHAIN_DEFAULTS = {
  // Delay days >= this is considered "high delay".
  HIGH_DELAY_DAYS: 3,
} as const;

function toLowerKeyMap(row: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of Object.keys(row ?? {})) out[String(k).toLowerCase()] = (row as any)[k];
  return out;
}

function pickValue(row: any, names: string[]): any {
  const m = toLowerKeyMap(row);
  for (const n of names) {
    const key = n.toLowerCase();
    if (key in m) return m[key];
  }
  return undefined;
}

function toNumber(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v: any): boolean | null {
  if (v === true || v === false) return v;
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (["true", "t", "yes", "y", "1"].includes(s)) return true;
  if (["false", "f", "no", "n", "0"].includes(s)) return false;
  return null;
}

function parseDate(v: any): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffDays(a: Date, b: Date): number {
  // a - b in days
  const msPerDay = 1000 * 60 * 60 * 24;
  return (a.getTime() - b.getTime()) / msPerDay;
}

function normalizeStatus(v: any): string {
  if (v == null) return "";
  return String(v).trim().toLowerCase();
}



function computeDelayDays(row: any): number {
  // Prefer explicit delay fields if present.
  const delayDirect = pickValue(row, [
    "delay_days",
    "days_delayed",
    "delay",
    "days_late",
    "late_days",
  ]);
  if (delayDirect != null && delayDirect !== "") {
    const n = toNumber(delayDirect, NaN);
    if (Number.isFinite(n)) return n;
  }

  const actual = parseDate(
    pickValue(row, [
      "delivery_date",
      "delivered_date",
      "actual_delivery_date",
      "actual_delivery",
      "delivered_at",
      "arrival_date",
    ])
  );

  const expected = parseDate(
    pickValue(row, [
      "expected_delivery_date",
      "expected_date",
      "promised_date",
      "promise_date",
      "due_date",
      "eta",
    ])
  );

  if (actual && expected) {
    return diffDays(actual, expected);
  }

  return 0;
}

function computeOnTime(row: any, delayDays: number): boolean | null {
  // 1) explicit on_time field
  const onTimeRaw = pickValue(row, ["on_time", "is_on_time", "ontime"]);
  const onTimeBool = toBool(onTimeRaw);
  if (onTimeBool !== null) return onTimeBool;

  // 2) status text
  const status = normalizeStatus(
    pickValue(row, ["delivery_status", "status", "shipment_status", "fulfillment_status"])
  );

  if (status) {
    if (status.includes("on time") || status.includes("ontime") || status.includes("delivered on time")) return true;
    if (status.includes("late") || status.includes("delayed") || status.includes("delay")) return false;
  }

  // 3) infer from delay days if we have signal
  if (Number.isFinite(delayDays)) {
    // treat <= 0 as on time (early/ontime)
    return delayDays <= 0;
  }

  return null;
}

function extractSku(row: any): string | null {
  const v = pickValue(row, ["sku", "item_sku", "product_sku", "item_id", "product_id", "part_number"]);
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function extractLocations(row: any): string[] {
  const vals: Array<any> = [
    pickValue(row, ["location_id", "facility_id", "warehouse_id", "plant_id"]),
    pickValue(row, ["origin", "origin_location", "from_location", "ship_from"]),
    pickValue(row, ["destination", "destination_location", "to_location", "ship_to"]),
  ];

  const out: string[] = [];
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) out.push(s);
  }
  return out;
}

function extractUnits(row: any): number {
  const qty = pickValue(row, ["quantity", "qty", "units", "unit_count", "items", "item_count"]);
  const n = toNumber(qty, NaN);
  // If missing/invalid, default to 1 so shipment still counts.
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function hasAnyField(row: any, fields: string[]): boolean {
  const m = toLowerKeyMap(row);
  return fields.some((f) => f.toLowerCase() in m);
}

function looksLikeValidSupplyChainRow(row: any): boolean {
  if (!row || typeof row !== "object") return false;

  // Basic "shape" heuristics: have at least one date-ish field AND one quantity-ish field OR an sku.
  const hasDate = hasAnyField(row, [
    "ship_date",
    "shipment_date",
    "order_date",
    "date",
    "delivery_date",
    "delivered_date",
    "expected_delivery_date",
    "eta",
  ]);

  const hasQtyOrSku =
    hasAnyField(row, ["quantity", "qty", "units", "unit_count", "items", "item_count"]) ||
    hasAnyField(row, ["sku", "item_sku", "product_sku", "product_id", "item_id", "part_number"]);

  return hasDate && hasQtyOrSku;
}

/**
 * Collect valid rows across datasets (same pattern as other domains).
 * Only includes datasets that are "ready" (no missing columns) if the dataset object contains issues.
 */
export function collectValidRowsForSupplyChain(
  datasets: Record<string, { rows?: any[]; issues?: { missing?: string[] } }>
): any[] {
  const all: any[] = [];

  for (const ds of Object.values(datasets || {})) {
    const missing = (ds as any)?.issues?.missing ?? [];
    const ready = Array.isArray(missing) ? missing.length === 0 : true;
    if (!ready) continue;

    const rows = (ds as any)?.rows ?? [];
    if (!Array.isArray(rows) || rows.length === 0) continue;

    for (const r of rows) {
      if (looksLikeValidSupplyChainRow(r)) all.push(r);
    }
  }

  return all;
}

/**
 * Compute Supply Chain KPIs from valid rows.
 * Rates are returned as percentages (0-100).
 */
export function computeSupplyChainKPIs(
  rows: any[],
  opts?: { highDelayDays?: number }
): SupplyChainKPIs {
  const highDelayDays = Number.isFinite(opts?.highDelayDays)
    ? Number(opts?.highDelayDays)
    : SUPPLYCHAIN_DEFAULTS.HIGH_DELAY_DAYS;

  const shipments = Array.isArray(rows) ? rows : [];
  const shipments_count = shipments.length;

  let total_units = 0;
  let onTimeCount = 0;
  let delayedCount = 0;
  let highDelayCount = 0;
  let delaySum = 0;
  let delayDenom = 0;

  const skus = new Set<string>();
  const locations = new Set<string>();

  for (const row of shipments) {
    const units = extractUnits(row);
    total_units += units;

    const sku = extractSku(row);
    if (sku) skus.add(sku);

    for (const loc of extractLocations(row)) locations.add(loc);

    const delayDays = computeDelayDays(row);
    const onTime = computeOnTime(row, delayDays);

    // Track avg delay only when we have a meaningful computed value.
    if (Number.isFinite(delayDays)) {
      delaySum += delayDays;
      delayDenom += 1;
    }

    if (onTime === true) onTimeCount += 1;
    if (onTime === false) delayedCount += 1;

    if (Number.isFinite(delayDays) && delayDays >= highDelayDays) highDelayCount += 1;
  }

  const avg_units_per_shipment = shipments_count > 0 ? total_units / shipments_count : 0;

  const on_time_delivery_rate = shipments_count > 0 ? (onTimeCount / shipments_count) * 100 : 0;
  const delay_rate = shipments_count > 0 ? (delayedCount / shipments_count) * 100 : 0;
  const high_delay_share = shipments_count > 0 ? (highDelayCount / shipments_count) * 100 : 0;

  const unique_skus = skus.size;
  const unique_locations = locations.size;

  const avg_delay_days = delayDenom > 0 ? delaySum / delayDenom : 0;

  return {
    shipments_count,
    total_units,
    avg_units_per_shipment,
    on_time_delivery_rate,
    delay_rate,
    high_delay_share,
    unique_skus,
    unique_locations,
    avg_delay_days,
  };
}
