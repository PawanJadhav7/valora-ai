// app/lib/kpis/validation.ts

import { validateFinanceRows } from "./finance";
import { validateInsuranceRows } from "./insurance";
import { validateHealthcareRows } from "./healthcare";
import { validateSaaSRows } from "./saas";

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

type ValidationResult = {
  cols: string[];
  missing: string[];
  notes: string[];
  domainTitle?: string;
};

type DomainRule = {
  title: string;
  requiredAnyGroups: Array<{ label: string; anyOf: string[] }>;
  tips: string[];
};

function domainRules(domain: string): DomainRule {
  const d = (domain || "").toLowerCase();

  if (d.includes("finance") || d.includes("bank")) {
    return {
      title: "Finance",
      requiredAnyGroups: [
        { label: "Transaction date", anyOf: ["txn_date", "transaction_date", "date", "posted_date"] },
        { label: "Amount", anyOf: ["amount", "txn_amount", "transaction_amount", "value", "net_amount"] },
        { label: "Client / Account", anyOf: ["client_id", "account_id", "customer_id"] },
      ],
      tips: ["One row per transaction works best.", "Include txn_date + amount + account_id/client_id."],
    };
  }
  

  if (d.includes("health")) {
    return {
      title: "Healthcare",
      requiredAnyGroups: [
        { label: "Service date", anyOf: ["service_date", "claim_date", "date_of_service", "date"] },
        { label: "Patient / Member", anyOf: ["patient_id", "member_id", "beneficiary_id"] },
        { label: "Charge / Paid amount", anyOf: ["claim_amount", "paid_amount", "charge_amount", "amount"] },
      ],
      tips: ["One row per claim/encounter works best.", "Include service_date + patient_id/member_id + claim_amount/paid_amount."],
    };
  }

  if (d.includes("supply")) {
    return {
      title: "Supply Chain",
      requiredAnyGroups: [
        { label: "Date", anyOf: ["date", "ship_date", "order_date", "delivery_date"] },
        { label: "SKU / Item", anyOf: ["sku", "item_id", "product_id"] },
        { label: "Quantity", anyOf: ["quantity", "qty", "units"] },
      ],
      tips: ["One row per shipment/order line works best.", "Include date + sku/item + quantity."],
    };
  }

  if (d.includes("saas") || d.includes("subscription")) {
    return {
      title: "SaaS & Subscription",
      requiredAnyGroups: [
        { label: "Date", anyOf: ["date", "invoice_date", "event_date", "period_start"] },
        { label: "Customer", anyOf: ["customer_id", "account_id", "client_id"] },
        { label: "Amount", anyOf: ["mrr", "arr", "amount", "revenue", "net_amount"] },
      ],
      tips: ["One row per invoice/event works best.", "Include date + customer + mrr/amount."],
    };
  }

  // E-commerce / default
  if (d.includes("e-commerce") || d.includes("ecommerce") || d.includes("e-comm")) {
    return {
      title: "E-commerce",
      requiredAnyGroups: [
        { label: "Order date", anyOf: ["order_date", "date", "orderdate", "OrderDate"] },
        { label: "Revenue / Amount", anyOf: ["revenue", "amount", "sales", "total", "netrevenue"] },
        { label: "Customer ID", anyOf: ["customer_id", "customerid", "customer", "CustomerID"] },
      ],
      tips: ["One row per order is ideal.", "Include order_date + revenue + customer_id for best KPIs."],
    };
  }

  return {
    title: "General",
    requiredAnyGroups: [
      { label: "Date", anyOf: ["date", "created_at", "timestamp"] },
      { label: "Amount / Metric", anyOf: ["amount", "value", "metric", "revenue"] },
    ],
    tips: ["Include a date column + a numeric metric column."],
  };
}

function validateGeneric(domain: string, rows: any[]): ValidationResult {
  const cols = getColumnsFromRows(rows);
  const rules = domainRules(domain);

  const missing: string[] = [];
  for (const g of rules.requiredAnyGroups) {
    if (!hasAny(cols, g.anyOf)) missing.push(g.label);
  }

  const notes: string[] = [];
  if (missing.length > 0) {
    notes.push(`Missing: ${missing.join(", ")}.`);
    notes.push(...rules.tips);
  }

  return { cols, missing, notes, domainTitle: rules.title };
}

function validateSupplyChainRows(rows: any[]): ValidationResult {
  // Strict (domain-aware) validation for Supply Chain
  const domain = "Supply Chain";
  const cols = getColumnsFromRows(rows);

  const rules: DomainRule = {
    title: domain,
    requiredAnyGroups: [
      { label: "Ship/Order date", anyOf: ["ship_date", "order_date", "delivery_date", "date"] },
      { label: "SKU / Item", anyOf: ["sku", "item_id", "product_id"] },
      { label: "Quantity", anyOf: ["quantity", "qty", "units"] },
    ],
    tips: [
      "One row per shipment/order line works best.",
      "Include ship_date/order_date + sku/item + quantity.",
      "Optional columns that unlock better KPIs: promised_date, delivered_date, carrier, warehouse, lead_time_days.",
    ],
  };

  const missing: string[] = [];
  for (const g of rules.requiredAnyGroups) {
    if (!hasAny(cols, g.anyOf)) missing.push(g.label);
  }

  const notes: string[] = [];
  if (missing.length > 0) {
    notes.push(`Missing: ${missing.join(", ")}.`);
    notes.push(...rules.tips);
  }

  return { cols, missing, notes, domainTitle: rules.title };
}

/**
 * ✅ Single entry point used by dashboard
 * - Uses strict domain validators where they exist (finance/insurance)
 * - Falls back to generic rules for other domains (for now)
 */
export function validateRowsForDomain(domain: string, rows: any[]): ValidationResult {
  const d = (domain || "").toLowerCase();

  // Use domain-specific validators when available
  if (d.includes("finance") || d.includes("bank")) return validateFinanceRows(rows);
  // Insurance uses strict claims-centric validation from insurance.ts
  if (d.includes("insur")) return validateInsuranceRows(rows);
  // Health uses strict health-centric validation from health.ts
  if (d.includes("health")) return validateHealthcareRows(rows);
  // Supply Chain uses a strict supply-chain-centric validation
  if (d.includes("supply")) return validateSupplyChainRows(rows);
  // SaaS uses a strict SaaS-centric validation
  if (d.includes("saas") || d.includes("subscription")) return validateSaaSRows(rows);
  // E-commerce uses a strict ecommerce-centric validation
  //if (d.includes("ecomm") || d.includes("ecomm")) return validateSaaSRows(rows);

  // For other domains, use generic rules for now (won’t break current app)
  return validateGeneric(domain, rows);
}
