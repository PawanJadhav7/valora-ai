// app/lib/utils/rowExtractors.ts

// Case-insensitive value picker
function pickValueCI(row: any, keys: string[]) {
  if (!row || typeof row !== "object") return undefined;

  const map: Record<string, any> = {};
  for (const k of Object.keys(row)) {
    map[k.toLowerCase()] = row[k];
  }

  for (const k of keys) {
    const v = map[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return v;
    }
  }
  return undefined;
}

export function pickNumber(row: any, keys: string[]): number {
  const v = pickValueCI(row, keys);
  if (v === undefined) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function pickString(row: any, keys: string[]): string {
  const v = pickValueCI(row, keys);
  return v === undefined ? "" : String(v).trim();
}

export function parseBool(v: any): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return false;
  return s === "true" || s === "1" || s === "yes" || s === "y" || s === "t";
}