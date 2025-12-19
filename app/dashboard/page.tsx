"use client";

import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { useRouter, useSearchParams } from "next/navigation";
import { computeDomainPack } from "@/app/lib/domainPacks";
import { validateRowsForDomain } from "@/app/lib/kpis/validation";
// import { pickNumber, pickString, parseBool } from "@/app/lib/utils/rowExtractors";



//import { validateInsuranceRows } from "@/app/lib/kpis/validation";
// Comment: Import Insurance validation from centralized validation.ts.


import { 
  collectValidRowsForSaaS, 
  computeSaaSKPIs } 
  from "@/app/lib/kpis/saas";

import {
  collectValidRowsForHealthcare,
  computeHealthcareKPIs,
} from "@/app/lib/kpis/healthcare";


import {
  computeFinanceKPIs,
  collectValidRowsForFinance,
} from "@/app/lib/kpis/finance";

import {
  collectValidRowsForInsurance,
  computeInsuranceKPIs,
} from "@/app/lib/kpis/insurance";

import type { SupplyChainKPIs } from "@/app/lib/kpis/supplychain";
import { computeSupplyChainKPIs, collectValidRowsForSupplyChain } from "@/app/lib/kpis/supplychain";

import {
  collectValidRowsForEcommerce,
  computeEcommerceKPIs,
} from "@/app/lib/kpis/ecommerce";

import {
  housesKey,
  activeHouseKey,
  datasetsKey,
  activeClientKey as activeClientKeyStorage,
} from "@/app/lib/clientStorage";

interface ClientDataset {
  rows: any[];
  displayName: string;
  rowCount: number;
  uploadedAt: string; // ISO string
  

   // D-2 additions
  columns?: string[];
  issues?: {
    missing: string[];
    notes: string[];
    detected?: string[];
  };
}

interface ChartPoint {
  label: string;
  revenue: number;
}

interface ProductMetric {
  key: string;
  displayKey: string;
  revenue: number;
  quantity: number;
  orderCount: number;
  revenueShare: number;
}

type DatasetIssues = {
  missing: string[];
  detected: string[]; // optional: for debugging
};

export type Dataset = {
  rows: any[];
  issues?: DatasetIssues;
};

function normalizeHeader(h: string) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

type Insight = { title: string; body: string };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type BadgeCls = "emerald" | "amber" | "rose" | "slate";
type Badge = { label: string; cls: BadgeCls };

function DiagnosticCard({
  label,
  value,
  badge,
  note,
}: {
  label: string;
  value: React.ReactNode;
  badge?: Badge | null;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400">{label}</span>
        {badge ? <StatusBadge {...badge} /> : null}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
      {note ? <div className="mt-1 text-[10px] text-slate-500">{note}</div> : null}
    </div>
  );
}

function DiagnosticStat({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
      {note ? <div className="mt-1 text-[10px] text-slate-500">{note}</div> : null}
    </div>
  );
}


function extractNumber(row: any, possibleNames: string[]): number {
  const lowerMap: Record<string, any> = {};
  for (const key of Object.keys(row ?? {})) lowerMap[key.toLowerCase()] = row[key];

  for (const name of possibleNames) {
    const key = name.toLowerCase();
    if (key in lowerMap) {
      const n = Number(lowerMap[key]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return "$0";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function cashFlowDirection(net: number) {
  const eps = 1e-6; // treat near-zero as balanced

  if (!Number.isFinite(net)) {
    return { label: "Unknown", dotClass: "bg-slate-400", textClass: "text-slate-200" };
  }

  if (net > eps) {
    return { label: "Healthy", dotClass: "bg-emerald-400", textClass: "text-emerald-200" };
  }

  if (net < -eps) {
    return { label: "Warning", dotClass: "bg-rose-400", textClass: "text-rose-200" };
  }

  return { label: "Balanced", dotClass: "bg-slate-400", textClass: "text-slate-200" };
}



function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}


function getColumnsFromRows(rows: any[]): string[] {
  if (!rows || rows.length === 0) return [];
  const cols = Object.keys(rows[0] ?? {});
  return cols.map(normalizeHeader);
}



type DomainRule = {
  title: string;
  requiredAnyGroups: Array<{ label: string; anyOf: string[] }>;
  tips: string[];
};





export default function DashboardPage() {
  const router = useRouter();
  const isPro = false; // TODO: load from session/billing
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") ?? "";

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeHouseId, setActiveHouseId] = useState<string | null>(null);
  const [houseDomain, setHouseDomain] = useState<string>("E-commerce");

  const [showOnboarding, setShowOnboarding] = useState(false);

  // ✅ Datasets are now scoped per (user + house)
  const [datasets, setDatasets] = useState<Record<string, ClientDataset>>({});
  const [activeClient, setActiveClient] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const btnPrimary =
    "inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:from-cyan-300 hover:to-emerald-300";
  const btnSecondary =
    "inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition";
  const btnOutline =
    "inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition";
  const btnDanger =
    "inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-medium border border-rose-500/50 text-rose-300 hover:bg-rose-500/10";

  function handleSignOut() {
    try {
      localStorage.removeItem("valoraSessionV1");
    } catch {}
    router.push("/");
  }

  // Show onboarding if first time OR from landing
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("valoraOnboardingSeenV1") === "1";
    if (!seen || from === "landing") setShowOnboarding(true);
  }, [from]);

  // ✅ Load: session -> active house (per-user) -> domain -> datasets (scoped)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionRaw = localStorage.getItem("valoraSessionV1");
    if (!sessionRaw) {
      router.replace("/signin");
      return;
    }

    try {
      const session = JSON.parse(sessionRaw);
      const email = String(session.email || "").toLowerCase();
      setUserEmail(email);

      // Houses for this user
      const hk = housesKey(email);
      const ak = activeHouseKey(email);

      const housesRaw = localStorage.getItem(hk);
      const houses: Record<string, any> = housesRaw ? JSON.parse(housesRaw) : {};
      const ids = Object.keys(houses);

      if (ids.length === 0) {
        router.replace("/houses?manage=1");
        return;
      }

      // Active house for this user
      let houseId = localStorage.getItem(ak);

      if (!houseId || !houses[houseId]) {
        if (ids.length === 1) {
          houseId = ids[0];
          localStorage.setItem(ak, houseId);
        } else {
          router.replace("/houses?manage=1");
          return;
        }
      }
      if (!houseId) {
        router.replace("/houses?manage=1");
        return;
      }
      setActiveHouseId(houseId);

      const house = houses[houseId];
      const resolvedDomain =
        (house?.activeDomain && String(house.activeDomain).trim()) ||
        (house?.domain && String(house.domain).trim()) ||
        "E-commerce";
      setHouseDomain(resolvedDomain);

      // ✅ Load datasets scoped per (email + houseId)
      const dKey = datasetsKey(email, houseId);
      const cKey = activeClientKeyStorage(email, houseId);
      const migratedFlag = `valoraMigratedDatasetsV1:${email}:${houseId}`;
      const alreadyMigrated = localStorage.getItem(migratedFlag) === "1";

      const scopedDatasetsRaw = localStorage.getItem(dKey);
      const scopedDatasets = scopedDatasetsRaw ? JSON.parse(scopedDatasetsRaw) : null;

      // ✅ Optional one-time migration from legacy global keys (only if scoped is empty)
      if ((!scopedDatasets || typeof scopedDatasets !== "object") && !alreadyMigrated) {
        const legacyDsRaw = localStorage.getItem("valoraDatasetsV1");
        const legacyParsed = legacyDsRaw ? JSON.parse(legacyDsRaw) : null;

        if (legacyParsed && typeof legacyParsed === "object") {
          localStorage.setItem(dKey, JSON.stringify(legacyParsed));
          setDatasets(legacyParsed);
          
          const legacyActive = localStorage.getItem("valoraActiveClientKey");
          if (legacyActive && legacyParsed?.[legacyActive]) {
            localStorage.setItem(cKey, legacyActive);
            setActiveClient(legacyActive);
          } else {
            
            setActiveClient(null);
          }
          localStorage.setItem(migratedFlag, "1");
        } else {
          
          setDatasets({});
          setActiveClient(null);
          localStorage.setItem(migratedFlag, "1");
        }
      } else {
        
        const scopedObj = scopedDatasets && typeof scopedDatasets === "object" ? scopedDatasets : {};
        setDatasets(scopedObj);
        const activeClientRaw = localStorage.getItem(cKey);
        if (activeClientRaw && scopedDatasets?.[activeClientRaw]) setActiveClient(activeClientRaw);
        else setActiveClient(null);
      }
    } catch {
      router.replace("/signin");
    }
  }, [router]);

  // ✅ Save datasets + active client scoped per (user + house)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userEmail || !activeHouseId) return;

    try {
      const dKey = datasetsKey(userEmail, activeHouseId);
      const cKey = activeClientKeyStorage(userEmail, activeHouseId);

      localStorage.setItem(dKey, JSON.stringify(datasets));

      if (activeClient) localStorage.setItem(cKey, activeClient);
      else localStorage.removeItem(cKey);
    } catch (err) {
      console.warn("Failed to save scoped datasets/client to localStorage", err);
    }
  }, [datasets, activeClient, userEmail, activeHouseId]);



  

  const rawData = activeClient ? datasets[activeClient]?.rows ?? [] : [];

  const activeDatasetMissingCount = useMemo(() => {
    if (!activeClient) return 0;
    const ds = datasets[activeClient];
    return ds?.issues?.missing?.length ? ds.issues.missing.length : 0;
  }, [datasets, activeClient]);

const canGenerateReport = activeClient && activeDatasetMissingCount === 0;

  const activeDatasetIssues = useMemo(() => {
      if (!activeClient) return null;
      const ds = datasets[activeClient];
      if (!ds?.issues) return null;
      if (!ds.issues.missing?.length) return null;
      return ds.issues;
    }, [datasets, activeClient]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.[^/.]+$/, "");

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = (results.data as any[]) ?? [];

        let displayName = baseName.replace(/_/g, " ").replace(/\s+/g, " ").trim();
        if (rows.length > 0 && (rows[0] as any)?.company_name) {
          displayName = String((rows[0] as any).company_name);
        }

        const validation = validateRowsForDomain(houseDomain, rows);

        const newDataset: ClientDataset = {
          rows,
          displayName,
          rowCount: rows.length,
          uploadedAt: new Date().toISOString(),
          columns: validation.cols,
          issues: { missing: validation.missing, notes: validation.notes },
        };

        setDatasets((prev) => ({ ...prev, [baseName]: newDataset }));

        // ✅ only auto-activate if READY (no missing columns)
        if ((validation.missing ?? []).length === 0) {
          setActiveClient(baseName);
        } else {
          // keep whatever was active before
          setActiveClient((prev) => prev);
        }

        e.target.value = "";

      },
      error: (err) => console.error("CSV parse failed:", err),
    });
  }

  function handleClearDatasets() {
    setDatasets({});
    setActiveClient(null);

    if (!userEmail || !activeHouseId) return;

    try {
      localStorage.removeItem(datasetsKey(userEmail, activeHouseId));
      localStorage.removeItem(activeClientKeyStorage(userEmail, activeHouseId));
    } catch (err) {
      console.warn("Failed to clear scoped datasets from localStorage", err);
    }
  }

  function handleSetActiveClient(key: string) {
    setActiveClient(key);
  }

  function handleRemoveDataset(key: string) {
    setDatasets((prev) => {
      const copy = { ...prev };
      delete copy[key];

      if (activeClient === key) {
        const remaining = Object.keys(copy);
        setActiveClient(remaining[0] ?? null);
      }
      return copy;
    });
  }
  //Comment: Domain flags to control which KPI grid renders (and prevent Ecom fallback on Insurance).

  const domain = (houseDomain ?? "").toLowerCase();
  const isEcom = domain.includes("e-commerce") || domain.includes("ecommerce");
  const isFinance = domain.includes("finance") || domain.includes("bank");
  const isInsurance = domain.includes("insur");
  const isSupplyChain = domain.includes("supply") || domain.includes("logistics") || domain.includes("warehouse");
  const isHealthcare = domain.includes("health") || domain.includes("medical") || domain.includes("hospital");


//----------------------------Finance Memo Hooks----------------------------//

  const financeDomain = (houseDomain || "").toLowerCase().includes("finance");
  const financeAllDatasetsCount = useMemo(() => Object.keys(datasets || {}).length, [datasets]);
  

  const financeReadyDatasetsCount = useMemo(() => {
    let ready = 0;
    for (const ds of Object.values(datasets || {})) {
      const missing = (ds as any)?.issues?.missing ?? [];
      if (missing.length === 0 && (ds as any)?.rows?.length) ready += 1;
    }
    return ready;
  }, [datasets]);

  // ---------------------------
  // Finance — raw inputs
  // ---------------------------

  const financeRowsAllValid = useMemo(() => {
      if (!houseDomain.toLowerCase().includes("finance")) return [];
      return collectValidRowsForFinance(datasets);
    }, [datasets, houseDomain]);

  const financeKPIs = useMemo(() => {
    if (!houseDomain.toLowerCase().includes("finance")) return null;
    return computeFinanceKPIs(financeRowsAllValid);
  }, [financeRowsAllValid, houseDomain]);

   const financeCoverageDays = useMemo(() => {
  if (!financeRowsAllValid?.length) return 0;
  
  const dateKeys = ["txn_date", "transaction_date", "date", "posted_date"];
  const toDate = (x: any) => {
    if (!x) return null;
    const d = new Date(x);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const firstValue = (row: any, keys: string[]) => {
    for (const k of keys) if (row?.[k] != null) return row[k];
    return null;
  };

  let minT = Number.POSITIVE_INFINITY;
  let maxT = Number.NEGATIVE_INFINITY;

  for (const r of financeRowsAllValid) {
    const d = toDate(firstValue(r, dateKeys));
    if (!d) continue;
    const t = d.getTime();
    if (t < minT) minT = t;
    if (t > maxT) maxT = t;
  }

  if (!Number.isFinite(minT) || !Number.isFinite(maxT) || maxT <= minT) return 0;
    return Math.max(1, Math.round((maxT - minT) / (1000 * 60 * 60 * 24)));
  }, [financeRowsAllValid]);

    const financeTxnPerDay = useMemo(() => {
    if (!financeKPIs) return 0;
    const days = financeCoverageDays || 1;
    return financeKPIs.txn_count / days;
  }, [financeKPIs, financeCoverageDays]);

  const financeTxnPerAccount = useMemo(() => {
    if (!financeKPIs) return 0;
    const denom = financeKPIs.unique_accounts || 0;
    return denom > 0 ? financeKPIs.txn_count / denom : 0;
  }, [financeKPIs]);


    // --- Finance diagnostics derived values (needed by JSX) ---
const financeFlowDirection = useMemo(() => {
  if (!financeKPIs) return "—";
  const net = Number(financeKPIs.net_cash_flow ?? 0);
  if (net > 0) return "Net inflow";
  if (net < 0) return "Net outflow";
  return "Balanced";
}, [financeKPIs]);

const financeInflowOutflowRatio = useMemo(() => {
  if (!financeKPIs) return null;
  const inflow = Number(financeKPIs.total_inflow ?? 0);
  const outflow = Math.abs(Number(financeKPIs.total_outflow ?? 0));
  if (outflow <= 0) return inflow > 0 ? "∞" : "—";
  return (inflow / outflow).toFixed(2);
}, [financeKPIs]);

const financeRiskLevel = useMemo<"Low" | "Medium" | "Elevated" | "Unknown">(() => {
  if (!financeKPIs) return "Unknown";
  const fraud = Number(financeKPIs.fraud_rate ?? 0);
  const highValue = Number(financeKPIs.high_value_txn_share ?? 0);

  // simple composite rule (tweak thresholds anytime)
  if (fraud >= 3 || highValue >= 20) return "Elevated";
  if (fraud >= 1 || highValue >= 10) return "Medium";
  return "Low";
}, [financeKPIs]);

// ---------------------------
// Finance — derived memo (KPIs + diagnostics + insights)
// ---------------------------

  const financeComputed = useMemo(() => {
  const hasData = rawData.length > 0;
  const insights: Insight[] = [];

  // ✅ always define outputs in this scope
  let totalRevenue = 0;
  let orderCount = 0;
  let avgOrderValue = 0;

  let totalCustomers = 0;
  let repeatCustomerRate = 0;

  let atRiskRevenue = 0;
  let recentRevenue30 = 0;

  let avgRevenuePerCustomer = 0;
  let avgOrdersPerCustomer = 0;

  let newCustomers30 = 0;
  let returningCustomers30 = 0;

  let top10CustomerShare = 0;

  let productMetrics: ProductMetric[] = [];
  let chartPoints: ChartPoint[] = [];

  if (!hasData) {
    insights.push(
      {
        title: "Start by uploading your data",
        body: "Upload a CSV with order_date, revenue, and customer_id to see live KPIs and insights.",
      },
      {
        title: "What Valora AI will show",
        body: "You’ll see revenue, orders, unique/repeat customers, at-risk revenue, and trends automatically.",
      },
      {
        title: "Good first dataset",
        body: "Export one row per order with order date, customer id, and revenue/amount.",
      }
    );

    return {
      hasData,
      totalRevenue,
      orderCount,
      avgOrderValue,
      totalCustomers,
      repeatCustomerRate,
      atRiskRevenue,
      recentRevenue30,
      avgRevenuePerCustomer,
      avgOrdersPerCustomer,
      newCustomers30,
      returningCustomers30,
      top10CustomerShare,
      productMetrics,
      chartPoints,
      insights,
    };
  }

  // ------------------------
  // Your parsing logic
  // ------------------------
  let sumRevenue = 0;
  let countedOrders = 0;

  const customerOrderCounts = new Map<string, number>();
  const customerLastOrderDate = new Map<string, Date>();
  const customerFirstOrderDate = new Map<string, Date>();
  const customerRevenueMap = new Map<string, number>();

  const productMetricsMap = new Map<string, { revenue: number; quantity: number; orderCount: number }>();

  let maxDate: Date | null = null;

  for (const row of rawData) {
    const revenue = extractNumber(row, ["revenue", "amount", "sales", "total", "netrevenue"]);
    if (revenue > 0) {
      sumRevenue += revenue;
      countedOrders += 1;
    }

    const custRaw = row.customer_id ?? row.customerId ?? row.customer ?? row.Customer ?? row.CustomerID ?? null;
    const customerKey = custRaw != null ? String(custRaw) : null;

    const dateRaw = row.order_date ?? row.date ?? row.orderDate ?? row.OrderDate ?? null;
    let orderDate: Date | null = null;
    if (dateRaw) {
      const d = new Date(dateRaw);
      if (!Number.isNaN(d.getTime())) {
        orderDate = d;
        if (!maxDate || d > maxDate) maxDate = d;
      }
    }

    if (customerKey) {
      customerOrderCounts.set(customerKey, (customerOrderCounts.get(customerKey) ?? 0) + 1);

      if (orderDate) {
        const prevLast = customerLastOrderDate.get(customerKey);
        if (!prevLast || orderDate > prevLast) customerLastOrderDate.set(customerKey, orderDate);

        const prevFirst = customerFirstOrderDate.get(customerKey);
        if (!prevFirst || orderDate < prevFirst) customerFirstOrderDate.set(customerKey, orderDate);
      }

      customerRevenueMap.set(customerKey, (customerRevenueMap.get(customerKey) ?? 0) + (revenue > 0 ? revenue : 0));
    }

    const productRaw = row.product_id ?? row.productId ?? row.sku ?? row.SKU ?? row.ProductID ?? null;
    const productKey = productRaw != null ? String(productRaw) : "Unknown";

    const qtyCandidate = extractNumber(row, ["quantity", "qty", "units"]);
    const qty = qtyCandidate > 0 ? qtyCandidate : 1;

    const current = productMetricsMap.get(productKey) ?? { revenue: 0, quantity: 0, orderCount: 0 };
    current.revenue += revenue > 0 ? revenue : 0;
    current.quantity += qty;
    current.orderCount += 1;
    productMetricsMap.set(productKey, current);
  }

  // ✅ finalize primary metrics
  totalRevenue = sumRevenue;
  orderCount = countedOrders;
  avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  totalCustomers = customerOrderCounts.size;
  avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  avgOrdersPerCustomer = totalCustomers > 0 ? orderCount / totalCustomers : 0;

  const repeatCount = Array.from(customerOrderCounts.values()).filter((c) => c > 1).length;
  repeatCustomerRate = totalCustomers > 0 ? (repeatCount / totalCustomers) * 100 : 0;

  // ✅ product metrics list (IMPORTANT: assign to productMetrics)
  if (productMetricsMap.size > 0 && totalRevenue > 0) {
    const temp: ProductMetric[] = [];
    for (const [key, agg] of productMetricsMap.entries()) {
      temp.push({
        key,
        displayKey: key,
        revenue: agg.revenue,
        quantity: agg.quantity,
        orderCount: agg.orderCount,
        revenueShare: (agg.revenue / totalRevenue) * 100,
      });
    }
    temp.sort((a, b) => b.revenue - a.revenue);
    productMetrics = temp; // ✅ assign
  }

  // ✅ time-based metrics + chart
  if (maxDate) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const atRiskThresholdDays = 60;
    const recentDays = 30;

    let atRiskSum = 0;
    let recentSum = 0;

    for (const row of rawData) {
      const revenue = extractNumber(row, ["revenue", "amount", "sales", "total", "netrevenue"]);
      if (revenue <= 0) continue;

      const dateRaw = row.order_date ?? row.date ?? row.orderDate ?? row.OrderDate ?? null;
      if (!dateRaw) continue;

      const d = new Date(dateRaw);
      if (Number.isNaN(d.getTime())) continue;

      const diffDays = (maxDate.getTime() - d.getTime()) / msPerDay;
      if (diffDays >= 0 && diffDays <= recentDays) recentSum += revenue;
      if (diffDays >= atRiskThresholdDays) atRiskSum += revenue;
    }

    recentRevenue30 = recentSum;
    atRiskRevenue = atRiskSum;

    // new vs returning (30d)
    const counts = new Map<string, number>();
    for (const [k, v] of customerOrderCounts.entries()) counts.set(k, v);

    for (const [customerKey, firstDate] of customerFirstOrderDate.entries()) {
      const lastDate = customerLastOrderDate.get(customerKey) ?? firstDate;

      const diffLast = (maxDate.getTime() - lastDate.getTime()) / msPerDay;
      const diffFirst = (maxDate.getTime() - firstDate.getTime()) / msPerDay;

      if (diffLast >= 0 && diffLast <= recentDays) {
        const oc = counts.get(customerKey) ?? 0;
        if (oc === 1 && diffFirst <= recentDays) newCustomers30 += 1;
        else returningCustomers30 += 1;
      }
    }

    // monthly chart
    const monthlyMap = new Map<string, number>();
    for (const row of rawData) {
      const revenue = extractNumber(row, ["revenue", "amount", "sales", "total", "netrevenue"]);
      if (revenue <= 0) continue;

      const dateRaw = row.order_date ?? row.date ?? row.orderDate ?? row.OrderDate ?? null;
      if (!dateRaw) continue;

      const d = new Date(dateRaw);
      if (Number.isNaN(d.getTime())) continue;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + revenue);
    }

    const entries = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const lastSix = entries.slice(-6);

    chartPoints =
      lastSix.length > 0
        ? lastSix.map(([key, revenue]) => {
            const [yy, mm] = key.split("-");
            const d = new Date(Number(yy), Number(mm) - 1, 1);
            return { label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }), revenue };
          })
        : [];
  }

  // ✅ top-10 customer share
  if (totalRevenue > 0 && customerRevenueMap.size > 0) {
    const arr = Array.from(customerRevenueMap.entries()).sort((a, b) => b[1] - a[1]);
    const top = arr.slice(0, 10).reduce((s, [, v]) => s + v, 0);
    top10CustomerShare = (top / totalRevenue) * 100;
  }

  // insights
  const recentShare = totalRevenue > 0 ? (recentRevenue30 / totalRevenue) * 100 : 0;
  const atRiskShare = totalRevenue > 0 ? (atRiskRevenue / totalRevenue) * 100 : 0;

  insights.push({
    title: "Overall performance snapshot",
    body: `Your dataset contains ${orderCount.toLocaleString("en-US")} orders from ${totalCustomers.toLocaleString(
      "en-US"
    )} customers, generating ${formatCurrency(totalRevenue)}. AOV ≈ ${formatCurrency(avgOrderValue)}.`,
  });

  insights.push({
    title: "Customer loyalty",
    body: `${repeatCustomerRate.toFixed(1)}% of customers placed more than one order.`,
  });

  insights.push({
    title: "Momentum",
    body: `${formatCurrency(recentRevenue30)} (${recentShare.toFixed(1)}%) comes from the last 30 days.`,
  });

  insights.push({
    title: "At-risk revenue",
    body: `${formatCurrency(atRiskRevenue)} (${atRiskShare.toFixed(1)}%) is tied to customers inactive for >60 days.`,
  });

  return {
    hasData,
    totalRevenue,
    orderCount,
    avgOrderValue,
    totalCustomers,
    repeatCustomerRate,
    atRiskRevenue,
    recentRevenue30,
    avgRevenuePerCustomer,
    avgOrdersPerCustomer,
    newCustomers30,
    returningCustomers30,
    top10CustomerShare,
    productMetrics,
    chartPoints,
    insights,
  };
}, [rawData]);

// ---------------------------
// Finance — destructured values
// ---------------------------

    const {
    hasData,
    totalRevenue,
    orderCount,
    avgOrderValue,
    totalCustomers,
    repeatCustomerRate,
    atRiskRevenue,
    recentRevenue30,
    avgRevenuePerCustomer,
    avgOrdersPerCustomer,
    newCustomers30,
    returningCustomers30,
    top10CustomerShare,
    productMetrics,
    chartPoints,
    insights,
  } = financeComputed;

 //-----------useMemo statuses (These Memo are for badges)-----------//
  const financeNetCashFlow = useMemo(() => {
    if (!financeKPIs) return 0;
    return financeKPIs.net_cash_flow;
  }, [financeKPIs]);

  const financeFraudRate = useMemo(() => {
    if (!financeKPIs) return 0;
    return financeKPIs.fraud_rate;
  }, [financeKPIs]);

  const financeHighValueShare = useMemo(() => {
    if (!financeKPIs) return 0;
    return financeKPIs.high_value_txn_share;
  }, [financeKPIs]);

  const flowStatus = cashFlowDirection(financeKPIs?.net_cash_flow ?? 0);


  const financeInflowOutflowStatus = useMemo<Badge | null>(() => {
  if (!hasData) return null;
  const r = financeInflowOutflowRatio === "∞" ? Number.POSITIVE_INFINITY : Number(financeInflowOutflowRatio);
  return inflowOutflowBadge(Number.isFinite(r) ? r : null);
}, [hasData, financeInflowOutflowRatio]);

const financeRiskStatus = useMemo<Badge | null>(() => {
  if (!hasData) return null;
  return riskPostureBadge(financeRiskLevel);
}, [hasData, financeRiskLevel]);

const financeFraudStatus = useMemo<Badge | null>(() => {
  if (!hasData) return null;
  return fraudRateBadge(financeFraudRate);
}, [hasData, financeFraudRate]);

const financeHighValueStatus = useMemo<Badge | null>(() => {
  if (!hasData) return null;
  return highValueShareBadge(financeHighValueShare);
}, [hasData, financeHighValueShare]);

const financeNetCashFlowStatus = useMemo<Badge | null>(() => {
  if (!hasData) return null;
  return netCashFlowBadge(financeNetCashFlow);
}, [hasData, financeNetCashFlow]);

const financeVelocityStatus = useMemo<Badge | null>(() => {
  if (!hasData) return null;
  return velocityBadge(financeTxnPerDay);
}, [hasData, financeTxnPerDay]);

const financeDensityStatus = useMemo<Badge | null>(() => {
  if (!hasData) return null;
  return densityBadge(financeTxnPerAccount);
}, [hasData, financeTxnPerAccount]);

const financeCoverageStatus = useMemo<Badge | null>(() => {
  if (!hasData) return null;
  return coverageBadge(financeCoverageDays);
}, [hasData, financeCoverageDays]);



  //----Badge Helper funntions(Finance)----//

  // Inflow/Outflow ratio: higher = healthier
function inflowOutflowBadge(ratio: number | null): Badge {
  if (ratio == null || !Number.isFinite(ratio)) return { label: "—", cls: "slate" };
  if (ratio >= 1.2) return { label: "Inflow-led", cls: "emerald" };
  if (ratio >= 0.9) return { label: "Balanced", cls: "amber" };
  return { label: "Outflow-led", cls: "rose" };
}

// Risk posture: already computed as Low/Medium/Elevated
function riskPostureBadge(level: string): Badge {
  const v = String(level || "").toLowerCase();
  if (v.includes("low")) return { label: "Low", cls: "emerald" };
  if (v.includes("med")) return { label: "Medium", cls: "amber" };
  if (v.includes("elev")) return { label: "Elevated", cls: "rose" };
  return { label: "Unknown", cls: "slate" };
}

// Fraud rate (%)
function fraudRateBadge(pct: number): Badge {
  if (!Number.isFinite(pct)) return { label: "—", cls: "slate" };
  if (pct < 0.5) return { label: "Low", cls: "emerald" };
  if (pct < 2.0) return { label: "Watch", cls: "amber" };
  return { label: "High", cls: "rose" };
}

// High-value share (% of transactions above threshold)
function highValueShareBadge(pct: number): Badge {
  if (!Number.isFinite(pct)) return { label: "—", cls: "slate" };
  if (pct < 5) return { label: "Normal", cls: "emerald" };
  if (pct < 12) return { label: "Elevated", cls: "amber" };
  return { label: "Concentrated", cls: "rose" };
}

// Net cash flow (currency). Positive=good, negative=stress
function netCashFlowBadge(net: number): Badge {
  if (!Number.isFinite(net)) return { label: "—", cls: "slate" };
  if (net > 0) return { label: "Positive", cls: "emerald" };
  if (net < 0) return { label: "Negative", cls: "rose" };
  return { label: "Flat", cls: "amber" };
}

// Transaction velocity (tx/day)
function velocityBadge(txPerDay: number): Badge {
  if (!Number.isFinite(txPerDay)) return { label: "—", cls: "slate" };
  if (txPerDay >= 25) return { label: "High", cls: "emerald" };
  if (txPerDay >= 8) return { label: "Moderate", cls: "amber" };
  return { label: "Low", cls: "rose" };
}

// Activity density (tx/account) — low can indicate sparse usage; very high can indicate heavy usage
function densityBadge(txPerAccount: number): Badge {
  if (!Number.isFinite(txPerAccount)) return { label: "—", cls: "slate" };
  if (txPerAccount >= 15) return { label: "High", cls: "emerald" };
  if (txPerAccount >= 5) return { label: "Normal", cls: "amber" };
  return { label: "Sparse", cls: "rose" };
}

// Time coverage (days)
function coverageBadge(days: number): Badge {
  if (!Number.isFinite(days) || days <= 0) return { label: "—", cls: "slate" };
  if (days >= 90) return { label: "Robust", cls: "emerald" };
  if (days >= 30) return { label: "OK", cls: "amber" };
  return { label: "Short", cls: "rose" };
}


//----------------------------Finance Memo Hooks----------------------------//





//----------------------------Supply Chain Memo Hooks----------------------------//


  const supplyDomain = (houseDomain || "").toLowerCase().includes("supply");
  
  const supplyRowsAllValid = useMemo(() => {
  if (!supplyDomain) return [];
  return collectValidRowsForSupplyChain(datasets);
  }, [datasets, supplyDomain]);

 const supplyKPIs = useMemo<SupplyChainKPIs | null>(() => {
  if (!supplyDomain || supplyRowsAllValid.length === 0) return null;
  return computeSupplyChainKPIs(supplyRowsAllValid);
  }, [supplyRowsAllValid, supplyDomain]);

  const supplyCoverageDays = useMemo(() => {
  if (!supplyRowsAllValid?.length) return 0;

  const dateKeys = ["ship_date", "shipment_date", "date", "order_date", "delivered_date"];
  const toDate = (x: any) => {
    if (!x) return null;
    const d = new Date(x);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const firstValue = (row: any, keys: string[]) => {
    for (const k of keys) if (row?.[k] != null) return row[k];
    return null;
  };

  let minT = Number.POSITIVE_INFINITY;
  let maxT = Number.NEGATIVE_INFINITY;

  for (const r of supplyRowsAllValid) {
    const d = toDate(firstValue(r, dateKeys));
    if (!d) continue;
    const t = d.getTime();
    if (t < minT) minT = t;
    if (t > maxT) maxT = t;
  }

  if (!Number.isFinite(minT) || !Number.isFinite(maxT) || maxT <= minT) return 0;
  return Math.max(1, Math.round((maxT - minT) / (1000 * 60 * 60 * 24)));
}, [supplyRowsAllValid]);

  // ---------------------------
// Supply Chain — badge helpers
// ---------------------------



function scDeliveryReliabilityBadge(onTime: number, delayRate: number): Badge {
  if (onTime >= 92 && delayRate <= 6) return { label: "Stable", cls: "emerald" };
  if (onTime >= 85 && delayRate <= 12) return { label: "Watch", cls: "amber" };
  return { label: "Unreliable", cls: "rose" };
}

function scDelaySeverityBadge(avgDelayDays: number): Badge {
  if (avgDelayDays <= 1.5) return { label: "Minor", cls: "emerald" };
  if (avgDelayDays <= 4) return { label: "Moderate", cls: "amber" };
  return { label: "Severe", cls: "rose" };
}

function scHighDelayExposureBadge(highDelayShare: number): Badge {
  if (highDelayShare <= 10) return { label: "Contained", cls: "emerald" };
  if (highDelayShare <= 25) return { label: "Elevated", cls: "amber" };
  return { label: "Critical", cls: "rose" };
}

function scShipmentIntensityBadge(shipmentsPerDay: number): Badge {
  if (shipmentsPerDay >= 30) return { label: "High", cls: "emerald" };
  if (shipmentsPerDay >= 10) return { label: "Moderate", cls: "amber" };
  return { label: "Low", cls: "slate" };
}

function scSkuComplexityBadge(shipmentsPerSku: number): Badge {
  if (shipmentsPerSku >= 8) return { label: "Focused", cls: "emerald" };
  if (shipmentsPerSku >= 3) return { label: "Moderate", cls: "amber" };
  return { label: "Fragmented", cls: "rose" };
}

function scLocationDispersionBadge(shipmentsPerLocation: number): Badge {
  if (shipmentsPerLocation >= 10) return { label: "Centralized", cls: "emerald" };
  if (shipmentsPerLocation >= 4) return { label: "Distributed", cls: "amber" };
  return { label: "Over-spread", cls: "rose" };
}

function scUnitDensityBadge(avgUnits: number): Badge {
  if (avgUnits >= 40) return { label: "Efficient", cls: "emerald" };
  if (avgUnits >= 20) return { label: "Average", cls: "amber" };
  return { label: "Sparse", cls: "rose" };
}

function scDelayPressureBadge(delayRate: number): Badge {
  if (delayRate <= 8) return { label: "Low", cls: "emerald" };
  if (delayRate <= 18) return { label: "Medium", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function scCoverageBadge(days: number): Badge {
  if (days >= 180) return { label: "Strong", cls: "emerald" };
  if (days >= 60) return { label: "Adequate", cls: "amber" };
  return { label: "Thin", cls: "slate" };
}

function scOnTimeBadge(rate: number): Badge {
  if (rate >= 95) return { label: "Excellent", cls: "emerald" };
  if (rate >= 85) return { label: "Watch", cls: "amber" };
  return { label: "At risk", cls: "rose" };
}


// --- Supply Chain badge helpers (unique names; avoid conflicts) ---


// ---------------------------
// Supply Chain — badge helpers
// ---------------------------
  

  



  // Supply Chain badges (simple v1)
  

const onTimeStatus = useMemo(() => {
  if (!supplyKPIs) return null;
  return scOnTimeBadge(supplyKPIs.on_time_delivery_rate);
}, [supplyKPIs]);


const supplyShipmentsPerDay = useMemo(() => {
if (!supplyKPIs) return 0;
const days = supplyCoverageDays || 1;
return supplyKPIs.shipments_count / days;
}, [supplyKPIs, supplyCoverageDays]);

const supplyShipmentsPerSku = useMemo(() => {
  if (!supplyKPIs) return 0;
  return supplyKPIs.unique_skus > 0
    ? supplyKPIs.shipments_count / supplyKPIs.unique_skus
    : 0;
}, [supplyKPIs]);

const supplyShipmentsPerLocation = useMemo(() => {
  if (!supplyKPIs) return 0;
  return supplyKPIs.unique_locations > 0
    ? supplyKPIs.shipments_count / supplyKPIs.unique_locations
    : 0;
}, [supplyKPIs]);

const scReliabilityStatus = useMemo(
  () =>
    supplyKPIs
      ? scDeliveryReliabilityBadge(
          supplyKPIs.on_time_delivery_rate,
          supplyKPIs.delay_rate
        )
      : null,
  [supplyKPIs]
);

const scDelaySeverityStatus = useMemo(
  () => (supplyKPIs ? scDelaySeverityBadge(supplyKPIs.avg_delay_days) : null),
  [supplyKPIs]
);

const scHighDelayStatus = useMemo(
  () => (supplyKPIs ? scHighDelayExposureBadge(supplyKPIs.high_delay_share) : null),
  [supplyKPIs]
);

const scIntensityStatus = useMemo(
  () => scShipmentIntensityBadge(supplyShipmentsPerDay),
  [supplyShipmentsPerDay]
);

const scSkuStatus = useMemo(
  () => scSkuComplexityBadge(supplyShipmentsPerSku),
  [supplyShipmentsPerSku]
);

const scLocationStatus = useMemo(
  () => scLocationDispersionBadge(supplyShipmentsPerLocation),
  [supplyShipmentsPerLocation]
);

const scUnitDensityStatus = useMemo(
  () => (supplyKPIs ? scUnitDensityBadge(supplyKPIs.avg_units_per_shipment) : null),
  [supplyKPIs]
);

const scDelayPressureStatus = useMemo(
  () => (supplyKPIs ? scDelayPressureBadge(supplyKPIs.delay_rate) : null),
  [supplyKPIs]
);

const scCoverageStatus = useMemo(
  () => scCoverageBadge(supplyCoverageDays),
  [supplyCoverageDays]
);

const supplyAllDatasetsCount = useMemo(() => Object.keys(datasets || {}).length, [datasets]);

const supplyReadyDatasetsCount = useMemo(() => {
  let ready = 0;
  for (const ds of Object.values(datasets || {})) {
    const missing = (ds as any)?.issues?.missing ?? [];
    if (missing.length === 0 && (ds as any)?.rows?.length) ready += 1;
  }
  return ready;
}, [datasets]);


//----------------------------Supply Chain Memo Hooks----------------------------//



  // --- E-commerce badge helpers (D-7.6) ---


function repeatBadge(ratePct: number): Badge {
  if (ratePct >= 45) return { label: "Strong", cls: "emerald" };
  if (ratePct >= 25) return { label: "OK", cls: "amber" };
  return { label: "Low", cls: "rose" };
}

function concentrationBadge(sharePct: number): Badge {
  // top-10 customer revenue share
  if (sharePct < 35) return { label: "Diversified", cls: "emerald" };
  if (sharePct < 55) return { label: "Moderate", cls: "amber" };
  return { label: "Concentrated", cls: "rose" };
}

function momentumBadge(recentSharePct: number): Badge {
  // revenue_last_30d / total_revenue
  if (recentSharePct >= 35) return { label: "Hot", cls: "emerald" };
  if (recentSharePct >= 18) return { label: "Stable", cls: "amber" };
  return { label: "Cooling", cls: "rose" };
}

function atRiskBadge(atRiskSharePct: number): Badge {
  // at_risk_revenue / total_revenue
  if (atRiskSharePct < 15) return { label: "Low", cls: "emerald" };
  if (atRiskSharePct < 35) return { label: "Watch", cls: "amber" };
  return { label: "High", cls: "rose" };
}
// --- E-commerce diagnostics badges ---

function ordersPerCustomerBadge(v: number): Badge {
  if (v >= 2.5) return { label: "Strong", cls: "emerald" };
  if (v >= 1.5) return { label: "Average", cls: "amber" };
  return { label: "Low", cls: "rose" };
}
// Comment: Higher repeat purchasing indicates healthy engagement.

function inactiveCustomerBadge(pct: number): Badge {
  if (pct <= 25) return { label: "Healthy", cls: "emerald" };
  if (pct <= 40) return { label: "Watch", cls: "amber" };
  return { label: "Risky", cls: "rose" };
}
// Comment: High inactive share signals retention problems.

function top1ShareBadge(pct: number): Badge {
  if (pct <= 20) return { label: "Diversified", cls: "emerald" };
  if (pct <= 35) return { label: "Concentrated", cls: "amber" };
  return { label: "High Risk", cls: "rose" };
}
// Comment: Dependency on a single customer increases revenue risk.

function top3ShareBadge(pct: number): Badge {
  if (pct <= 40) return { label: "Balanced", cls: "emerald" };
  if (pct <= 60) return { label: "Concentrated", cls: "amber" };
  return { label: "High Risk", cls: "rose" };
}
// Comment: Measures broader revenue concentration.

function rpcTrendBadge(pct: number): Badge {
  if (pct >= 5) return { label: "Improving", cls: "emerald" };
  if (pct >= -5) return { label: "Stable", cls: "amber" };
  return { label: "Declining", cls: "rose" };
}
// Comment: Revenue per customer momentum indicator.

function orderVolatilityBadge(cv: number): Badge {
  if (cv <= 0.35) return { label: "Stable", cls: "emerald" };
  if (cv <= 0.6) return { label: "Volatile", cls: "amber" };
  return { label: "Unstable", cls: "rose" };
}
// Comment: High volatility implies demand unpredictability.

  
  // --- SaaS Diagnostics badge helpers (D-6.5) ---

  function churnBadge(rate: number): { label: string; cls: "emerald" | "amber" | "rose" } {
    if (rate < 3) return { label: "Healthy", cls: "emerald" };
    if (rate < 7) return { label: "Watch", cls: "amber" };
    return { label: "High risk", cls: "rose" };
  }

  function revenueChurnBadge(rate: number): { label: string; cls: "emerald" | "amber" | "rose" } {
    if (rate < 5) return { label: "Stable", cls: "emerald" };
    if (rate < 10) return { label: "At risk", cls: "amber" };
    return { label: "Critical", cls: "rose" };
  }

/*---------------------------Healthcare Domain---------------------------*/

  // Comment: Healthcare diagnostic badge logic (D-5.3)

  function highCostBadge(share: number): Badge {
  if (share < 8) return { label: "Low", cls: "emerald" };
  if (share < 18) return { label: "Watch", cls: "amber" };
  return { label: "High", cls: "rose" };
  }

  function paidToChargeBadge(pct: number): Badge {
    // paid/charged % (higher is usually healthier)
    if (pct >= 80) return { label: "Healthy", cls: "emerald" };
    if (pct >= 55) return { label: "Watch", cls: "amber" };
    return { label: "Low", cls: "rose" };
  }

  function patientsBadge(count: number): Badge {
    if (count >= 2000) return { label: "Broad", cls: "emerald" };
    if (count >= 500) return { label: "Medium", cls: "amber" };
    return { label: "Small", cls: "slate" };
  }
  function denialBadge(rate: number): Badge {
    if (rate < 5) return { label: "Low", cls: "emerald" };
    if (rate < 12) return { label: "Watch", cls: "amber" };
    return { label: "High", cls: "rose" };
  }

  function costBadge(avg: number): Badge {
    if (avg < 1500) return { label: "Efficient", cls: "emerald" };
    if (avg < 4000) return { label: "Elevated", cls: "amber" };
    return { label: "High", cls: "rose" };
  }

  function providerConcentrationBadge(share: number): Badge {
    if (share < 40) return { label: "Diversified", cls: "emerald" };
    if (share < 65) return { label: "Moderate", cls: "amber" };
    return { label: "Concentrated", cls: "rose" };
  }

  function utilizationBadge(count: number): Badge {
    if (count < 500) return { label: "Normal", cls: "emerald" };
    if (count < 2000) return { label: "High", cls: "amber" };
    return { label: "Surge", cls: "rose" };
  }

  function readinessBadge(ready: number, total: number): Badge {
    if (ready === total && total > 0) return { label: "Ready", cls: "emerald" };
    if (ready > 0) return { label: "Partial", cls: "amber" };
    return { label: "Not ready", cls: "slate" };
  }



// --- Dataset readiness (Row 3) ---
const healthcareAllDatasets = useMemo(() => {
  return Object.values(datasets || {}).filter((ds: any) => (ds?.rows?.length ?? 0) > 0).length;
}, [datasets]);

const healthcareReadyDatasets = useMemo(() => {
  return Object.values(datasets || {}).filter((ds: any) => {
    const rowsOk = (ds?.rows?.length ?? 0) > 0;
    const missing = ds?.issues?.missing ?? [];
    return rowsOk && missing.length === 0;
  }).length;
}, [datasets]);



  // Comment: D-5.3B — Aggregates all valid Healthcare datasets and computes KPIs.
  const healthcareRowsAllValid = useMemo(() => {
    if (!houseDomain.toLowerCase().includes("health")) return [];
    return collectValidRowsForHealthcare(datasets);
  }, [datasets, houseDomain]);

  const healthcareKPIs = useMemo(() => {
    if (!houseDomain.toLowerCase().includes("health")) return null;
    return computeHealthcareKPIs(healthcareRowsAllValid);
  }, [healthcareRowsAllValid, houseDomain]);

  const hasHealthcareData = !!healthcareKPIs && healthcareRowsAllValid.length > 0;

  // Comment: D-5.2 — Badge status for Healthcare denials (used in diagnostics summary).
  const denialStatus = useMemo(() => {
    if (!healthcareKPIs) return null;
    return denialBadge(healthcareKPIs.denial_rate);
  }, [healthcareKPIs]);

  const costStatus = useMemo(() => {
    if (!healthcareKPIs) return null;
    return costBadge(healthcareKPIs.avg_paid_per_claim);
  }, [healthcareKPIs]);

  const providerStatus = useMemo(() => {
    if (!healthcareKPIs) return null;
    return providerConcentrationBadge(healthcareKPIs.provider_concentration_top10);
  }, [healthcareKPIs]);

  const utilizationStatus = useMemo(() => {
    if (!healthcareKPIs) return null;
    return utilizationBadge(healthcareKPIs.claims_count);
  }, [healthcareKPIs]);

  const healthcareAllDatasetsCount = useMemo(() => {
  let total = 0;
  for (const ds of Object.values(datasets || {})) {
    if ((ds as any)?.rows?.length) total += 1;
  }
  return total;
  }, [datasets]);

  const healthcareReadyDatasetsCount = useMemo(() => {
    let ready = 0;
    for (const ds of Object.values(datasets || {})) {
      const missing = (ds as any)?.issues?.missing ?? [];
      const hasRows = !!(ds as any)?.rows?.length;
      if (hasRows && missing.length === 0) ready += 1;
    }
    return ready;
  }, [datasets]);

  
  const healthcareReadinessStatus = useMemo(() => {
    return readinessBadge(healthcareReadyDatasetsCount, healthcareAllDatasetsCount);
  }, [healthcareReadyDatasetsCount, healthcareAllDatasetsCount]);

  const paidToChargedPct = useMemo(() => {
  if (!healthcareKPIs || healthcareKPIs.total_charged <= 0) return 0;
  return (healthcareKPIs.total_paid / healthcareKPIs.total_charged) * 100;
  }, [healthcareKPIs]);

  const claimsPerPatient = useMemo(() => {
  if (!healthcareKPIs || healthcareKPIs.unique_patients <= 0) return 0;
  return healthcareKPIs.claims_count / healthcareKPIs.unique_patients;
  }, [healthcareKPIs]);


  
  const providerConcentrationStatus = useMemo(() => {
    if (!healthcareKPIs) return null;
    return providerConcentrationBadge(healthcareKPIs.provider_concentration_top10);
  }, [healthcareKPIs]);


  const highCostStatus = useMemo(() => {
    if (!healthcareKPIs) return null;
    return highCostBadge(healthcareKPIs.high_cost_share);
  }, [healthcareKPIs]);

  const paidToChargePct = useMemo(() => {
    if (!healthcareKPIs) return 0;
    const charged = healthcareKPIs.total_charged || 0;
    return charged > 0 ? (healthcareKPIs.total_paid / charged) * 100 : 0;
  }, [healthcareKPIs]);

  const paidToChargeStatus = useMemo(() => {
    if (!healthcareKPIs) return null;
    return paidToChargeBadge(paidToChargePct);
  }, [healthcareKPIs, paidToChargePct]);

  const patientsStatus = useMemo(() => {
    if (!healthcareKPIs) return null;
    return patientsBadge(healthcareKPIs.unique_patients);
  }, [healthcareKPIs]);

// --- Healthcare status badges (for DiagnosticCard) ---



const avgClaimsPerPatient = useMemo(() => {
  if (!healthcareKPIs || healthcareKPIs.unique_patients <= 0) return 0;
  return healthcareKPIs.claims_count / healthcareKPIs.unique_patients;
}, [healthcareKPIs]);

const billingEfficiency = useMemo(() => {
  if (!healthcareKPIs || healthcareKPIs.total_charged <= 0) return 0;
  return (healthcareKPIs.total_paid / healthcareKPIs.total_charged) * 100;
}, [healthcareKPIs]);

const hcPaidPerPatient = useMemo(() => {
  if (!healthcareKPIs || healthcareKPIs.unique_patients <= 0) return 0;
  return healthcareKPIs.total_paid / healthcareKPIs.unique_patients;
}, [healthcareKPIs]);

const hcChargePerClaim = useMemo(() => {
  if (!healthcareKPIs || healthcareKPIs.claims_count <= 0) return 0;
  return healthcareKPIs.total_charged / healthcareKPIs.claims_count;
}, [healthcareKPIs]);

const hcDenialBurden = useMemo(() => {
  if (!healthcareKPIs) return 0;
  const deniedShare = (healthcareKPIs.denial_rate ?? 0) / 100; // denial_rate is %
  return (healthcareKPIs.total_charged ?? 0) * deniedShare;
}, [healthcareKPIs]);

const hcPaidChargeGapPct = useMemo(() => {
  // 1 − (paid ÷ charged) expressed as %
  if (!healthcareKPIs || healthcareKPIs.total_charged <= 0) return 0;
  const paid = healthcareKPIs.total_paid ?? 0;
  const charged = healthcareKPIs.total_charged ?? 0;
  const eff = charged > 0 ? paid / charged : 0;
  return Math.max(0, (1 - eff) * 100);
}, [healthcareKPIs]);

function hcBillingEfficiencyBadge(pct: number): Badge {
  if (pct >= 70) return { label: "Strong", cls: "emerald" };
  if (pct >= 45) return { label: "Watch", cls: "amber" };
  return { label: "Weak", cls: "rose" };
}

function hcClaimsPerPatientBadge(v: number): Badge {
  if (v <= 1.2) return { label: "Low", cls: "emerald" };
  if (v <= 2.5) return { label: "Moderate", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function hcPaidPerPatientBadge(v: number): Badge {
  if (v <= 800) return { label: "Low", cls: "emerald" };
  if (v <= 2500) return { label: "Mid", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function hcChargePerClaimBadge(v: number): Badge {
  if (v <= 1200) return { label: "Low", cls: "emerald" };
  if (v <= 3500) return { label: "Mid", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function hcDenialBurdenBadge(v: number): Badge {
  if (v <= 5000) return { label: "Low", cls: "emerald" };
  if (v <= 25000) return { label: "Rising", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function hcGapBadge(pct: number): Badge {
  if (pct <= 25) return { label: "Tight", cls: "emerald" };
  if (pct <= 45) return { label: "Wide", cls: "amber" };
  return { label: "Leak", cls: "rose" };
}

const healthcareHasData = useMemo(
  () => healthcareRowsAllValid.length > 0,
  [healthcareRowsAllValid]
);

const healthcareDenialStatus = useMemo(() => {
  if (!healthcareHasData || !healthcareKPIs) return null;
  return denialBadge(healthcareKPIs.denial_rate);
}, [healthcareHasData, healthcareKPIs]);

const healthcareHighCostStatus = useMemo(() => {
  if (!healthcareHasData || !healthcareKPIs) return null;
  return highCostBadge(healthcareKPIs.high_cost_share);
}, [healthcareHasData, healthcareKPIs]);

const healthcareProviderStatus = useMemo(() => {
  if (!healthcareHasData || !healthcareKPIs) return null;
  return providerConcentrationBadge(healthcareKPIs.provider_concentration_top10);
}, [healthcareHasData, healthcareKPIs]);

const hcBillingEfficiencyStatus = useMemo(() => {
  if (!healthcareKPIs) return null;
  return hcBillingEfficiencyBadge(billingEfficiency);
}, [healthcareKPIs, billingEfficiency]);

const hcClaimsPerPatientStatus = useMemo(() => {
  if (!healthcareKPIs) return null;
  return hcClaimsPerPatientBadge(avgClaimsPerPatient);
}, [healthcareKPIs, avgClaimsPerPatient]);

const hcPaidPerPatientStatus = useMemo(() => {
  if (!healthcareKPIs) return null;
  return hcPaidPerPatientBadge(hcPaidPerPatient);
}, [healthcareKPIs, hcPaidPerPatient]);

const hcChargePerClaimStatus = useMemo(() => {
  if (!healthcareKPIs) return null;
  return hcChargePerClaimBadge(hcChargePerClaim);
}, [healthcareKPIs, hcChargePerClaim]);

const hcDenialBurdenStatus = useMemo(() => {
  if (!healthcareKPIs) return null;
  return hcDenialBurdenBadge(hcDenialBurden);
}, [healthcareKPIs, hcDenialBurden]);

const hcPaidChargeGapStatus = useMemo(() => {
  if (!healthcareKPIs) return null;
  return hcGapBadge(hcPaidChargeGapPct);
}, [healthcareKPIs, hcPaidChargeGapPct]);

//----------------------------Insurance Memo Hooks----------------------------//

    // --- Insurance Pack (D-4.4): derived diagnostics (no KPI duplication) ---
  const insuranceDomain = (houseDomain || "").toLowerCase().includes("insur");

    const insuranceRowsAllValid = useMemo(() => {
    if (!houseDomain.toLowerCase().includes("insur")) return [];
    return collectValidRowsForInsurance(datasets);
  }, [datasets, houseDomain]);

  const insuranceKPIs = useMemo(() => {
    if (!houseDomain.toLowerCase().includes("insur")) return null;
    return computeInsuranceKPIs(insuranceRowsAllValid);
  }, [insuranceRowsAllValid, houseDomain]);

  const insuranceReadyDatasetsCount = useMemo(() => {
    let ready = 0;
    for (const ds of Object.values(datasets || {})) {
      const missing = (ds as any)?.issues?.missing ?? [];
      if (missing.length === 0 && (ds as any)?.rows?.length) ready += 1;
    }
    return ready;
  }, [datasets]);

  const insuranceAllDatasetsCount = useMemo(() => Object.keys(datasets || {}).length, [datasets]);


  const insuranceRiskLevel = useMemo(() => {
    if (!insuranceKPIs) return "—";
    const fraud = Number(insuranceKPIs.fraud_rate || 0);
    const sev = Number(insuranceKPIs.high_severity_share || 0);

    if (fraud >= 2.5 || sev >= 12) return "Elevated";
    if (fraud >= 1.0 || sev >= 6) return "Medium";
    return "Low";
  }, [insuranceKPIs]);

//----------------------------Insurance Badge Helpers----------------------------//

// ---------------------------
// Insurance — Badge helpers
// ---------------------------

// Insurance badge helpers (distinct names to avoid conflicts)
function insuranceLossRatioBadge(pct: number): Badge {
  if (pct < 60) return { label: "Efficient", cls: "emerald" };
  if (pct < 85) return { label: "Watch", cls: "amber" };
  return { label: "Risky", cls: "rose" };
}

function insuranceClaimsFreqBadge(claimsPerPolicy: number): Badge {
  if (claimsPerPolicy < 0.5) return { label: "Low", cls: "emerald" };
  if (claimsPerPolicy < 1.2) return { label: "Normal", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function insuranceSeverityBadge(avg: number): Badge {
  if (avg < 1000) return { label: "Low", cls: "emerald" };
  if (avg < 5000) return { label: "Moderate", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function insuranceLargeLossBadge(sharePct: number): Badge {
  if (sharePct < 2) return { label: "Low", cls: "emerald" };
  if (sharePct < 6) return { label: "Watch", cls: "amber" };
  return { label: "Elevated", cls: "rose" };
}

function insurancePolicyConcentrationBadge(sharePct: number): Badge {
  if (sharePct < 25) return { label: "Diversified", cls: "emerald" };
  if (sharePct < 45) return { label: "Moderate", cls: "amber" };
  return { label: "Concentrated", cls: "rose" };
}

function insuranceDenialBadge(ratePct: number | null): Badge {
  if (ratePct === null) return { label: "N/A", cls: "slate" };
  if (ratePct < 2) return { label: "Low", cls: "emerald" };
  if (ratePct < 6) return { label: "Watch", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function insurancePremiumMomentumBadge(pct: number | null): Badge {
  if (pct === null) return { label: "N/A", cls: "slate" };
  if (pct >= 5) return { label: "Growing", cls: "emerald" };
  if (pct >= -5) return { label: "Flat", cls: "amber" };
  return { label: "Declining", cls: "rose" };
}

function insuranceRetentionBadge(pct: number | null): Badge {
  if (pct === null) return { label: "N/A", cls: "slate" };
  if (pct >= 80) return { label: "Strong", cls: "emerald" };
  if (pct >= 60) return { label: "Watch", cls: "amber" };
  return { label: "Weak", cls: "rose" };
}

function insuranceCoverageBadge(days: number): Badge {
  if (days >= 180) return { label: "Strong", cls: "emerald" };
  if (days >= 60) return { label: "OK", cls: "amber" };
  return { label: "Limited", cls: "slate" };
}



function insuranceFraudBadge(ratePct: number): Badge {
  if (ratePct < 0.5) return { label: "Low", cls: "emerald" };
  if (ratePct < 2) return { label: "Watch", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function insuranceOpenRateBadge(ratePct: number): Badge {
  if (ratePct < 15) return { label: "Low", cls: "emerald" };
  if (ratePct < 35) return { label: "Watch", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function insuranceHighSeverityBadge(sharePct: number): Badge {
  if (sharePct < 5) return { label: "Low", cls: "emerald" };
  if (sharePct < 12) return { label: "Watch", cls: "amber" };
  return { label: "High", cls: "rose" };
}


function insuranceConcentrationBadge(sharePct: number): Badge {
  if (sharePct < 35) return { label: "Diversified", cls: "emerald" };
  if (sharePct < 55) return { label: "Moderate", cls: "amber" };
  return { label: "Concentrated", cls: "rose" };
}

function insuranceHighCostBadge(sharePct: number): Badge {
  if (sharePct < 8) return { label: "Low", cls: "emerald" };
  if (sharePct < 18) return { label: "Watch", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function insuranceStabilityBadge(cv: number): Badge {
  if (cv < 0.25) return { label: "Stable", cls: "emerald" };
  if (cv < 0.6) return { label: "Mixed", cls: "amber" };
  return { label: "Volatile", cls: "rose" };
}

function insuranceVelocityBadge(claimsPerDay: number): Badge {
  if (claimsPerDay >= 50) return { label: "High", cls: "emerald" };
  if (claimsPerDay >= 10) return { label: "Moderate", cls: "amber" };
  return { label: "Low", cls: "slate" };
}

function insuranceUtilizationBadge(claimsPerMember: number): Badge {
  if (claimsPerMember < 0.5) return { label: "Low", cls: "emerald" };
  if (claimsPerMember < 1.5) return { label: "Normal", cls: "amber" };
  return { label: "High", cls: "rose" };
}
function insuranceClaimsPerPolicyBadge(val: number): Badge {
  if (val < 0.5) return { label: "Low", cls: "emerald" };
  if (val < 1.5) return { label: "Normal", cls: "amber" };
  return { label: "High", cls: "rose" };
}
function insuranceUnderwritingMarginBadge(pct: number): Badge {
  if (pct >= 20) return { label: "Strong", cls: "emerald" };
  if (pct >= 5) return { label: "Thin", cls: "amber" };
  return { label: "Loss-making", cls: "rose" };
}

// -----------------------------------------------
// Insurance — derived metrics for diagnostics
// -----------------------------------------------
const insuranceUnderwritingMargin = useMemo(() => {
  if (!insuranceKPIs) return 0;
  return 100 - insuranceKPIs.loss_ratio;
}, [insuranceKPIs]);


const insuranceMarginStatus = useMemo(
  () =>
    insuranceKPIs
      ? insuranceUnderwritingMarginBadge(insuranceUnderwritingMargin)
      : null,
  [insuranceKPIs, insuranceUnderwritingMargin]
);

const insuranceClaimsFrequency = useMemo(() => {
  if (!insuranceKPIs) return 0;
  const denom = insuranceKPIs.unique_policies || 0;
  return denom > 0 ? insuranceKPIs.claims_count / denom : 0;
}, [insuranceKPIs]);

const insuranceDenialPressure = useMemo<number | null>(() => {
  if (!insuranceRowsAllValid?.length) return null;

  const statusKeys = ["claim_status", "status", "claimstate"];
  const getStatus = (row: any) => {
    for (const k of statusKeys) {
      const v = row?.[k];
      if (v != null && String(v).trim() !== "") return String(v).toLowerCase();
    }
    return "";
  };

  let total = 0;
  let denied = 0;
  let seenAnyStatus = false;

  for (const r of insuranceRowsAllValid) {
    const st = getStatus(r);
    if (st) seenAnyStatus = true;
    // only count rows that represent a claim (you already filtered valid claim rows upstream)
    total += 1;

    const isDenied =
      st.includes("deny") || st.includes("denied") || st.includes("reject") || st.includes("rejected");
    if (isDenied) denied += 1;
  }

  if (!seenAnyStatus || total === 0) return null;
  return (denied / total) * 100;
}, [insuranceRowsAllValid]);



const insuranceLossRatio = useMemo(() => {
  if (!insuranceKPIs) return 0;
  const prem = Number((insuranceKPIs as any).total_premium ?? 0);
  const paid = Number((insuranceKPIs as any).total_claims_paid ?? (insuranceKPIs as any).total_paid ?? 0);
  return prem > 0 ? (paid / prem) * 100 : 0;
}, [insuranceKPIs]);

const insuranceAvgPaidPerClaim = useMemo(() => {
  if (!insuranceKPIs) return 0;
  const paid = Number((insuranceKPIs as any).total_claims_paid ?? (insuranceKPIs as any).total_paid ?? 0);
  const c = Number((insuranceKPIs as any).claims_count ?? 0);
  return c > 0 ? paid / c : 0;
}, [insuranceKPIs]);

// Coverage days (min/max claim/service date) — same pattern as financeCoverageDays
// Insurance — coverage days
const insuranceCoverageDays = useMemo(() => {
  if (!insuranceRowsAllValid?.length) return 0;

  const dateKeys = ["claim_date", "loss_date", "reported_date", "transaction_date", "date"];
  const toDate = (x: any) => {
    if (!x) return null;
    const d = new Date(x);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const firstValue = (row: any, keys: string[]) => {
    for (const k of keys) if (row?.[k] != null) return row[k];
    return null;
  };

  let minT = Number.POSITIVE_INFINITY;
  let maxT = Number.NEGATIVE_INFINITY;

  for (const r of insuranceRowsAllValid) {
    const d = toDate(firstValue(r, dateKeys));
    if (!d) continue;
    const t = d.getTime();
    if (t < minT) minT = t;
    if (t > maxT) maxT = t;
  }

  if (!Number.isFinite(minT) || !Number.isFinite(maxT) || maxT <= minT) return 0;
  return Math.max(1, Math.round((maxT - minT) / (1000 * 60 * 60 * 24)));
}, [insuranceRowsAllValid]);

const insurancePremiumMomentumPct = useMemo<number | null>(() => {
  if (!insuranceRowsAllValid?.length) return null;

  const premiumKeys = ["premium", "written_premium", "earned_premium", "policy_premium"];
  const dateKeys = ["claim_date", "loss_date", "reported_date", "transaction_date", "date"];

  const getNum = (row: any, keys: string[]) => {
    for (const k of keys) {
      const v = row?.[k];
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return NaN;
  };
  const getDate = (row: any, keys: string[]) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v == null) continue;
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return null;
  };

  let maxDate: Date | null = null;
  for (const r of insuranceRowsAllValid) {
    const d = getDate(r, dateKeys);
    if (d && (!maxDate || d > maxDate)) maxDate = d;
  }
  if (!maxDate) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  let sum30 = 0;
  let sumPrev30 = 0;
  let sawAnyPremium = false;

  for (const r of insuranceRowsAllValid) {
    const prem = getNum(r, premiumKeys);
    if (!Number.isFinite(prem) || prem <= 0) continue;
    const d = getDate(r, dateKeys);
    if (!d) continue;

    sawAnyPremium = true;
    const diffDays = (maxDate.getTime() - d.getTime()) / msPerDay;

    if (diffDays >= 0 && diffDays <= 30) sum30 += prem;
    else if (diffDays > 30 && diffDays <= 60) sumPrev30 += prem;
  }

  if (!sawAnyPremium) return null;
  if (sumPrev30 <= 0) return sum30 > 0 ? 100 : 0;
  return ((sum30 - sumPrev30) / sumPrev30) * 100;
}, [insuranceRowsAllValid]);

// Insurance — claims/day
const insuranceClaimsPerDay = useMemo(() => {
  if (!insuranceKPIs) return 0;
  const days = insuranceCoverageDays || 1;
  return insuranceKPIs.claims_count / days;
}, [insuranceKPIs, insuranceCoverageDays]);

// Insurance — claims/policy
const insuranceClaimsPerPolicy = useMemo(() => {
  if (!insuranceKPIs) return 0;
  const policies = insuranceKPIs.unique_policies || 0;
  return policies > 0 ? insuranceKPIs.claims_count / policies : 0;
}, [insuranceKPIs]);
const insuranceRetentionProxy = useMemo<number | null>(() => {
  if (!insuranceRowsAllValid?.length) return null;

  const policyKeys = ["policy_id", "policyid", "policy_number", "policynumber"];
  const dateKeys = ["claim_date", "loss_date", "reported_date", "transaction_date", "date"];

  const getPolicy = (row: any) => {
    for (const k of policyKeys) {
      const v = row?.[k];
      if (v != null && String(v).trim() !== "") return String(v);
    }
    return "";
  };
  const getDate = (row: any) => {
    for (const k of dateKeys) {
      const v = row?.[k];
      if (v == null) continue;
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return null;
  };

  let maxDate: Date | null = null;
  const lastSeen = new Map<string, Date>();
  for (const r of insuranceRowsAllValid) {
    const pol = getPolicy(r);
    const d = getDate(r);
    if (!pol || !d) continue;

    if (!maxDate || d > maxDate) maxDate = d;
    const prev = lastSeen.get(pol);
    if (!prev || d > prev) lastSeen.set(pol, d);
  }

  if (!maxDate || lastSeen.size === 0) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  let active60 = 0;
  for (const d of lastSeen.values()) {
    const diff = (maxDate.getTime() - d.getTime()) / msPerDay;
    if (diff >= 0 && diff <= 60) active60 += 1;
  }

  return (active60 / lastSeen.size) * 100;
}, [insuranceRowsAllValid]);



// Example high-cost share: if you already compute it in KPIs, use it; else default 0
const insuranceHighCostShare = useMemo(() => {
  if (!insuranceKPIs) return 0;
  return Number((insuranceKPIs as any).high_cost_share ?? 0);
}, [insuranceKPIs]);

// Concentration share: if you already compute top10 policy/policyholder share, use it
const insuranceTop10PolicyShare = useMemo(() => {
  if (!insuranceKPIs) return 0;
  return Number((insuranceKPIs as any).top10_policy_premium_share ?? (insuranceKPIs as any).top10_concentration_share ?? 0);
}, [insuranceKPIs]);

// Member utilization: claims per member
const insuranceClaimsPerMember = useMemo(() => {
  if (!insuranceKPIs) return 0;
  const claims = Number((insuranceKPIs as any).claims_count ?? 0);
  const members = Number((insuranceKPIs as any).unique_members ?? (insuranceKPIs as any).unique_patients ?? 0);
  return members > 0 ? claims / members : 0;
}, [insuranceKPIs]);

// Stability CV: if you compute already, use it; else default 0
const insurancePremiumStabilityCv = useMemo(() => {
  if (!insuranceKPIs) return 0;
  return Number((insuranceKPIs as any).premium_volatility_cv ?? 0);
}, [insuranceKPIs]);


// Statuses
const insuranceFraudStatus = useMemo(() => (insuranceKPIs ? insuranceFraudBadge(insuranceKPIs.fraud_rate) : null), [insuranceKPIs]);
const insuranceOpenStatus = useMemo(() => (insuranceKPIs ? insuranceOpenRateBadge(insuranceKPIs.open_claim_rate) : null), [insuranceKPIs]);

const insuranceHighSevStatus = useMemo(() => (insuranceKPIs ? insuranceHighSeverityBadge(insuranceKPIs.high_severity_share) : null), [insuranceKPIs]);

const insuranceVelocityStatus = useMemo(() => (insuranceKPIs ? insuranceVelocityBadge(insuranceClaimsPerDay) : null), [insuranceKPIs, insuranceClaimsPerDay]);
const insuranceUtilStatus = useMemo(() => (insuranceKPIs ? insuranceClaimsPerPolicyBadge(insuranceClaimsPerPolicy) : null), [insuranceKPIs, insuranceClaimsPerPolicy]);
// --- Insurance status badges (for DiagnosticCard) ---//

const insuranceLossRatioStatus = useMemo(() => (insuranceKPIs ? insuranceLossRatioBadge(insuranceLossRatio) : null), [insuranceKPIs, insuranceLossRatio]);
const insuranceHighCostStatus = useMemo(() => (insuranceKPIs ? insuranceHighCostBadge(insuranceHighCostShare) : null), [insuranceKPIs, insuranceHighCostShare]);
const insuranceStabilityStatus = useMemo(() => (insuranceKPIs ? insuranceStabilityBadge(insurancePremiumStabilityCv) : null), [insuranceKPIs, insurancePremiumStabilityCv]);
const insuranceUtilizationStatus = useMemo(() => (insuranceKPIs ? insuranceUtilizationBadge(insuranceClaimsPerMember) : null), [insuranceKPIs, insuranceClaimsPerMember]);
const insuranceLossStatus = useMemo(() => (insuranceKPIs ? insuranceLossRatioBadge(insuranceKPIs.loss_ratio) : null), [insuranceKPIs]);

const insuranceFreqStatus = useMemo(() => (insuranceKPIs ? insuranceClaimsFreqBadge(insuranceClaimsFrequency) : null), [insuranceKPIs, insuranceClaimsFrequency]);

const insuranceSeverityStatus = useMemo(() => (insuranceKPIs ? insuranceSeverityBadge(insuranceKPIs.avg_claim_amount) : null), [insuranceKPIs]);

const insuranceLargeLossStatus = useMemo(() => (insuranceKPIs ? insuranceLargeLossBadge(insuranceKPIs.high_severity_share) : null), [insuranceKPIs]);

const insuranceConcentrationStatus = useMemo(() => (insuranceKPIs ? insurancePolicyConcentrationBadge(insuranceKPIs.policy_concentration_top10) : null), [insuranceKPIs]);

const insuranceDenialStatus = useMemo(() => insuranceDenialBadge(insuranceDenialPressure), [insuranceDenialPressure]);

const insurancePremiumMomentumStatus = useMemo(() => insurancePremiumMomentumBadge(insurancePremiumMomentumPct), [insurancePremiumMomentumPct]);

const insuranceRetentionStatus = useMemo(() => insuranceRetentionBadge(insuranceRetentionProxy), [insuranceRetentionProxy]);

const insuranceCoverageStatus = useMemo(() => insuranceCoverageBadge(insuranceCoverageDays), [insuranceCoverageDays]);

//----------------------------Insurance Memo Hooks----------------------------//


//----------------------------SaaS Memo Hooks----------------------------//
const saasDomain =
  (houseDomain || "").toLowerCase().includes("saas") ||
  (houseDomain || "").toLowerCase().includes("subscription");

const saasAllDatasetsCount = useMemo(() => Object.keys(datasets || {}).length, [datasets]);

const saasReadyDatasetsCount = useMemo(() => {
  let ready = 0;
  for (const ds of Object.values(datasets || {})) {
    const missing = (ds as any)?.issues?.missing ?? [];
    if (missing.length === 0 && (ds as any)?.rows?.length) ready += 1;
  }
  return ready;
}, [datasets]);

// ---------------------------------------
// SaaS — raw inputs (only valid datasets)
// ---------------------------------------

const saasRowsAllValid = useMemo(() => {
  if (!houseDomain.toLowerCase().includes("saas") && !houseDomain.toLowerCase().includes("subscription")) return [];
  return collectValidRowsForSaaS(datasets);
}, [datasets, houseDomain]);

const saasKPIs = useMemo(() => {
  if (!houseDomain.toLowerCase().includes("saas") && !houseDomain.toLowerCase().includes("subscription")) return null;
  return computeSaaSKPIs(saasRowsAllValid);
}, [saasRowsAllValid, houseDomain]);

const saasHasData = !!saasKPIs;

// --- Badge helpers (make sure these exist) ---
function growthBadge(rate: number): { label: string; cls: "emerald" | "amber" | "rose" } {
  if (rate >= 5) return { label: "Strong", cls: "emerald" };
  if (rate >= 0) return { label: "Flat", cls: "amber" };
  return { label: "Declining", cls: "rose" };
}

function arpuBadge(arpu: number): { label: string; cls: "emerald" | "amber" | "rose" } {
  if (arpu >= 200) return { label: "High", cls: "emerald" };
  if (arpu >= 50) return { label: "Mid", cls: "amber" };
  return { label: "Low", cls: "rose" };
}

function nrrBadge(nrr: number): { label: string; cls: "emerald" | "amber" | "rose" } {
  if (nrr >= 110) return { label: "Excellent", cls: "emerald" };
  if (nrr >= 100) return { label: "Healthy", cls: "amber" };
  return { label: "At risk", cls: "rose" };
}

// ---------------------------
// SaaS — derived metrics (diagnostics-friendly)
// ---------------------------
const saasNRR = useMemo(() => {
  if (!saasKPIs) return 0;
  // ✅ NRR proxy: 100 + expansion - contraction - revenue churn
  return 100 + saasKPIs.expansion_rate - saasKPIs.contraction_rate - saasKPIs.revenue_churn_rate;
}, [saasKPIs]);

// ---------------------------
// SaaS — badge helpers (unique names; avoid conflicts)
// ---------------------------
function saasGrowthBadge(rate: number): Badge {
  if (rate >= 5) return { label: "Strong", cls: "emerald" };
  if (rate >= 0) return { label: "Flat", cls: "amber" };
  return { label: "Declining", cls: "rose" };
}

function saasCustomerChurnBadge(rate: number): Badge {
  if (rate < 3) return { label: "Healthy", cls: "emerald" };
  if (rate < 7) return { label: "Watch", cls: "amber" };
  return { label: "High", cls: "rose" };
}

function saasRevenueChurnBadge(rate: number): Badge {
  if (rate < 5) return { label: "Stable", cls: "emerald" };
  if (rate < 10) return { label: "At risk", cls: "amber" };
  return { label: "Critical", cls: "rose" };
}

function saasArpuBadge(arpu: number): Badge {
  if (arpu >= 200) return { label: "High", cls: "emerald" };
  if (arpu >= 50) return { label: "Mid", cls: "amber" };
  return { label: "Low", cls: "slate" };
}

function saasNrrBadge(nrr: number): Badge {
  if (nrr >= 110) return { label: "Excellent", cls: "emerald" };
  if (nrr >= 100) return { label: "Healthy", cls: "amber" };
  return { label: "At risk", cls: "rose" };
}

function saasConcentrationBadge(share: number): Badge {
  if (share <= 35) return { label: "Diversified", cls: "emerald" };
  if (share <= 55) return { label: "Moderate", cls: "amber" };
  return { label: "Concentrated", cls: "rose" };
}

function saasCustomerBaseBadge(active: number): Badge {
  if (active >= 1000) return { label: "Large", cls: "emerald" };
  if (active >= 200) return { label: "Growing", cls: "amber" };
  return { label: "Small", cls: "slate" };
}

function saasExpansionBadge(rate: number): Badge {
  if (rate >= 8) return { label: "Strong", cls: "emerald" };
  if (rate >= 2) return { label: "Healthy", cls: "amber" };
  return { label: "Limited", cls: "slate" };
}

// ---------------------------
// SaaS — statuses (for 9 indicator cards)
// ---------------------------
const saasGrowthStatus = useMemo(() => {
  if (!saasKPIs) return null;
  return saasGrowthBadge(Number(saasKPIs.mrr_growth_rate ?? 0));
}, [saasKPIs]);

const saasChurnStatus = useMemo(() => {
  if (!saasKPIs) return null;
  return saasCustomerChurnBadge(Number(saasKPIs.customer_churn_rate ?? 0));
}, [saasKPIs]);

const saasRevenueChurnStatus = useMemo(() => {
  if (!saasKPIs) return null;
  return saasRevenueChurnBadge(Number(saasKPIs.revenue_churn_rate ?? 0));
}, [saasKPIs]);

const saasArpuStatus = useMemo(() => {
  if (!saasKPIs) return null;
  return saasArpuBadge(Number(saasKPIs.arpu ?? 0));
}, [saasKPIs]);

const saasNRRStatus = useMemo(() => {
  if (!saasKPIs) return null;
  return saasNrrBadge(saasNRR);
}, [saasKPIs, saasNRR]);

const saasConcentrationStatus = useMemo(() => {
  if (!saasKPIs) return null;
  return saasConcentrationBadge(Number(saasKPIs.top10_revenue_share ?? 0));
}, [saasKPIs]);

const saasCustomerBaseStatus = useMemo(() => {
  if (!saasKPIs) return null;
  return saasCustomerBaseBadge(Number(saasKPIs.active_customers ?? 0));
}, [saasKPIs]);

// ✅ ready flag (use in header “Active/Preview”)
const saasReady = saasHasData && saasRowsAllValid.length > 0;


//----------------------------SAAS Memo Hooks----------------------------//

//----------------------------E-commerce Memo Hooks----------------------------//

  const ecommerceRowsAllValid = useMemo(() => {
  const d = (houseDomain || "").toLowerCase();
  if (!d.includes("e-commerce") && !d.includes("ecommerce") && !d.includes("e-comm")) return [];
  return collectValidRowsForEcommerce(datasets);
}, [datasets, houseDomain]);

  const ecommerceKPIs = useMemo(() => {
  if (!houseDomain.toLowerCase().includes("e-comm") && !houseDomain.toLowerCase().includes("ecommerce")&& !houseDomain.toLowerCase().includes("e-comm")) return null;
  return computeEcommerceKPIs(ecommerceRowsAllValid);
  }, [ecommerceRowsAllValid, houseDomain]);

  const ecommerceRecentShare = useMemo(() => {
  if (!ecommerceKPIs || ecommerceKPIs.total_revenue <= 0) return 0;
  return (ecommerceKPIs.revenue_last_30d / ecommerceKPIs.total_revenue) * 100;
}, [ecommerceKPIs]);

const ecommerceAtRiskShare = useMemo(() => {
  if (!ecommerceKPIs || ecommerceKPIs.total_revenue <= 0) return 0;
  return (ecommerceKPIs.at_risk_revenue / ecommerceKPIs.total_revenue) * 100;
}, [ecommerceKPIs]);

const ecommerceRepeatStatus = useMemo(() => {
  if (!ecommerceKPIs) return null;
  return repeatBadge(Number(ecommerceKPIs.repeat_customer_rate || 0));
}, [ecommerceKPIs]);

const ecommerceConcentrationStatus = useMemo(() => {
  if (!ecommerceKPIs) return null;
  return concentrationBadge(Number(ecommerceKPIs.top10_customer_revenue_share || 0));
}, [ecommerceKPIs]);

const ecommerceMomentumStatus = useMemo(() => {
  if (!ecommerceKPIs) return null;
  return momentumBadge(ecommerceRecentShare);
}, [ecommerceKPIs, ecommerceRecentShare]);

const ecommerceAtRiskStatus = useMemo(() => {
  if (!ecommerceKPIs) return null;
  return atRiskBadge(ecommerceAtRiskShare);
}, [ecommerceKPIs, ecommerceAtRiskShare]);

const ecommerceOrdersPerCustomerStatus = useMemo<Badge | null>(() => {
  if (!ecommerceKPIs) return null;
  return ordersPerCustomerBadge(ecommerceKPIs.avg_orders_per_customer);
}, [ecommerceKPIs]);

const ecommerceInactiveStatus = useMemo<Badge | null>(() => {
  if (!ecommerceKPIs) return null;
  return inactiveCustomerBadge(ecommerceKPIs.inactive_customer_share);
}, [ecommerceKPIs]);

const ecommerceTop1Status = useMemo<Badge | null>(() => {
  if (!ecommerceKPIs) return null;
  return top1ShareBadge(ecommerceKPIs.top1_customer_revenue_share);
}, [ecommerceKPIs]);

const ecommerceTop3Status = useMemo<Badge | null>(() => {
  if (!ecommerceKPIs) return null;
  return top3ShareBadge(ecommerceKPIs.top3_customer_revenue_share);
}, [ecommerceKPIs]);

const ecommerceRpcTrendStatus = useMemo<Badge | null>(() => {
  if (!ecommerceKPIs) return null;
  return rpcTrendBadge(ecommerceKPIs.rev_per_customer_change_pct_30d);
}, [ecommerceKPIs]);

const ecommerceVolatilityStatus = useMemo<Badge | null>(() => {
  if (!ecommerceKPIs) return null;
  return orderVolatilityBadge(ecommerceKPIs.weekly_order_volatility_cv);
}, [ecommerceKPIs]);

const ecommerceReadyDatasetsCount = useMemo(() => {
  let ready = 0;
  for (const ds of Object.values(datasets || {})) {
    const missing = (ds as any)?.issues?.missing ?? [];
    if (missing.length === 0 && (ds as any)?.rows?.length) ready += 1;
  }
  return ready;
}, [datasets]);

const ecommerceAllDatasetsCount = useMemo(() => Object.keys(datasets || {}).length, [datasets]);

const ecommerceReady = ecommerceReadyDatasetsCount > 0;
  

// --- Finance Pack (D-3.1) : derived diagnostics (no KPI duplication) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {isSidebarOpen && (
        <aside className="hidden md:flex w-60 flex-col border-r border-slate-800 bg-slate-950/80">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-lg">
              V
            </div>
            <div>
              <div className="text-sm font-semibold">Valora AI</div>
              <div className="text-[11px] text-slate-400">Analytics workspace</div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 text-sm space-y-1">
            <SidebarItem label="Overview" active targetId="section-overview" />
            <SidebarItem label="Revenue" targetId="section-revenue" />
            <SidebarItem label="Customers" targetId="section-customers" />
            <SidebarItem label="Products" targetId="section-products" />
            <SidebarItem label="Reports" targetId="section-reports" />
          </nav>

          <div className="px-4 py-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span>Usage</span>
              <span className="text-slate-200 font-medium">68%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-900">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
            </div>
            <div className="flex items-center justify-between">
              <span>10 of 15 reports used</span>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col">
        <header className="border-b border-slate-800 bg-slate-950/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start md:items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-slate-200 text-xs hover:bg-slate-800"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isSidebarOpen ? "⟨" : "⟩"}
              </button>

              <div>
                <h1 className="text-lg md:text-xl font-semibold tracking-tight">Client insights overview</h1>
                <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                  A snapshot of revenue, customers, and product performance for your business.
                </p>
                <div className="mt-1 text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                  {userEmail && (
                    <span className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition">
                      {userEmail}
                    </span>
                  )}
                  <span className={cn("px-2 py-0.5 rounded-full border transition", domainBadgeClasses(houseDomain))}>
                    House domain: {houseDomain}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              
              <button onClick={() => router.push("/houses?manage=1")} className={btnOutline} title="Manage domains">
                Manage Domains
              </button>

              <button onClick={handleSignOut} className={btnOutline}>
                Sign out
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 bg-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
            {showOnboarding && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-slate-100 font-semibold">Welcome to Valora AI</div>
                  <div className="text-slate-400">
                    Upload a CSV to automatically generate KPIs, charts, product insights, and AI recommendations.
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Tip: Include <span className="text-slate-300">order_date</span>,{" "}
                    <span className="text-slate-300">revenue</span>,{" "}
                    <span className="text-slate-300">customer_id</span>,{" "}
                    <span className="text-slate-300">product_id</span>.
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem("valoraOnboardingSeenV1", "1");
                  }}
                  className="px-3 py-1.5 rounded-lg text-[11px] border border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 whitespace-nowrap"
                >
                  Got it
                </button>
              </div>
            )}

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Currently viewing:</span>
              <span className="text-slate-100 font-medium">
                {activeClient
                  ? datasets[activeClient]?.displayName ?? activeClient
                  : Object.keys(datasets).length === 0
                  ? "No dataset selected"
                  : "Select a client from the dropdown"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              className="bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 h-9 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition"
              value={activeClient ?? ""}
              onChange={(e) => setActiveClient(e.target.value || null)}
            >
              <option value="">
                {Object.keys(datasets).length === 0 ? "No datasets uploaded" : "Select a client"}
              </option>
              {Object.keys(datasets).map((key) => {
                const ds = datasets[key];
                return (
                  <option key={key} value={key}>
                    {ds.displayName} ({ds.rowCount} rows)
                  </option>
                );
              })}
            </select>

            <select
              className="bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 h-9 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition"
              defaultValue="all"
              suppressHydrationWarning
            >
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Last 12 months</option>
            </select>

            <input
              type="text"
              placeholder="Search by product, region, customer..."
              className="flex-1 min-w-[180px] bg-slate-900/80 border border-slate-700 rounded-lg px-3 h-9 text-slate-200 placeholder:text-slate-500 hover:border-cyan-400/60 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)] transition"
            />
            <button
                className={cn(
                  btnPrimary,
                  !canGenerateReport && "opacity-50 cursor-not-allowed"
                )}
                disabled={!canGenerateReport}
                title={
                  !activeClient
                    ? "Select a dataset first"
                    : activeDatasetMissingCount > 0
                    ? "Fix missing columns (see warning) to generate report"
                    : "Generate a report"
                }
                onClick={() => {
                  if (!canGenerateReport) return;
                  // TODO: your report action
                  console.log("Generate report");
                }}
              >
                Generate report
              </button>
            <label className={btnSecondary}>
                Upload CSV
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>

              <button className={btnOutline}  disabled title="Coming soon">Export</button>

              <button onClick={handleClearDatasets} className={btnDanger}>
                Clear
              </button>

          </div>

            {/* --- KPI + Packs + Charts + Tables: unchanged below --- */}
            
            {activeDatasetIssues && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs">
                <div className="font-semibold text-amber-200">Dataset needs a few columns for {houseDomain} KPIs</div>
                <div className="mt-1 text-[11px] text-amber-100/80">
                  {activeDatasetIssues.notes.map((n, i) => (
                    <div key={i}>{n}</div>
                  ))}
                </div>
              </div>
            )}
            <section id="section-overview" className="space-y-4">
              {/* KPI cards: Insurance → Healthcare → Supply Chain → Finance → SaaS → E-com */}
              {
                  houseDomain.toLowerCase().includes("insur") ? (
                  insuranceKPIs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard label="Claims count" value={insuranceKPIs.claims_count.toLocaleString("en-US")} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Number of valid claims." />
                      <KpiCard label="Total claims" value={formatCurrency(insuranceKPIs.total_claims)} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Sum of claim amounts." />
                      <KpiCard label="Avg claim" value={insuranceKPIs ? formatCurrency(insuranceKPIs.avg_claim_amount) : "—"} delta="Average severity" hasData={!!insuranceKPIs} animateKey={activeClient} tooltip="Average claim amount."/>
                      <KpiCard label="Open claim rate" value={`${insuranceKPIs.open_claim_rate.toFixed(2)}%`} delta="Open / total" hasData animateKey={activeClient} tooltip="Percent still open/pending." />
                      <KpiCard label="Loss ratio" value={`${insuranceKPIs.loss_ratio.toFixed(2)}%`} delta="Claims / premium" hasData animateKey={activeClient} tooltip="Claims as % of premium." />
                      <KpiCard label="High severity share" value={`${insuranceKPIs.high_severity_share.toFixed(2)}%`} delta=">= threshold" hasData animateKey={activeClient} tooltip="Percent high-severity claims." />
                      <KpiCard label="Fraud rate" value={`${insuranceKPIs.fraud_rate.toFixed(2)}%`} delta="Flagged / total" hasData animateKey={activeClient} tooltip="Percent flagged via is_fraud or fraud_rule." />
                      <KpiCard label="Active policies" value={insuranceKPIs ? insuranceKPIs.unique_policies.toLocaleString("en-US") : "—"} delta="Distinct policy_id" hasData={!!insuranceKPIs} animateKey={activeClient} tooltip="Unique policies in valid data."/>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard label="Claims count" value="—" delta="Upload Insurance CSV" tooltip="Number of valid claims." />
                      <KpiCard label="Total claims" value="—" delta="Upload Insurance CSV" tooltip="Sum of claim amounts." />
                      <KpiCard label="Avg claim" value="—" delta="Upload Insurance CSV" tooltip="Average claim amount." />
                      <KpiCard label="Open claim rate" value="—" delta="Upload Insurance CSV" tooltip="Percent still open/pending." />

                      <KpiCard label="Loss ratio" value="—" delta="Upload Insurance CSV" tooltip="Claims as % of premium." />
                      <KpiCard label="High severity share" value="—" delta="Upload Insurance CSV" tooltip="Percent high-severity claims." />
                      <KpiCard label="Fraud rate" value="—" delta="Upload Insurance CSV" tooltip="Percent flagged via is_fraud or fraud_rule." />
                      <KpiCard label="Active policies" value="—" delta="Upload Insurance CSV" tooltip="Unique policies in valid data." />
                    </div>
                  )
                ) : houseDomain.toLowerCase().includes("health") ? (
                    healthcareKPIs ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Claims count" value={healthcareKPIs.claims_count.toLocaleString("en-US")} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Valid claim rows counted." />
                        <KpiCard label="Total paid" value={formatCurrency(healthcareKPIs.total_paid)} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Sum of paid/allowed amounts." />
                        <KpiCard label="Total charged" value={formatCurrency(healthcareKPIs.total_charged)} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Sum of billed/charge amounts." />
                        <KpiCard label="Avg paid / claim" value={formatCurrency(healthcareKPIs.avg_paid_per_claim)} delta="Total paid / claims" hasData animateKey={activeClient} tooltip="Average paid amount per claim." />

                        <KpiCard label="Denial rate" value={`${healthcareKPIs.denial_rate.toFixed(2)}%`} delta="Denied / total" hasData animateKey={activeClient} tooltip="Percent denied via flag or status." />
                        <KpiCard label="High-cost share" value={`${healthcareKPIs.high_cost_share.toFixed(2)}%`} delta=">= threshold" hasData animateKey={activeClient} tooltip="Percent above high-cost threshold." />
                        <KpiCard label="Unique patients" value={healthcareKPIs.unique_patients.toLocaleString("en-US")} delta="Distinct patient/member" hasData animateKey={activeClient} tooltip="Distinct patients in valid data." />
                        <KpiCard label="Top-10 provider share" value={`${healthcareKPIs.provider_concentration_top10.toFixed(2)}%`} delta="% of paid" hasData animateKey={activeClient} tooltip="Paid concentration in top 10 providers." />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Claims count" value="—" delta="Upload Healthcare CSV" tooltip="Valid claim rows counted." />
                        <KpiCard label="Total paid" value="—" delta="Upload Healthcare CSV" tooltip="Sum of paid/allowed amounts." />
                        <KpiCard label="Total charged" value="—" delta="Upload Healthcare CSV" tooltip="Sum of billed/charge amounts." />
                        <KpiCard label="Avg paid / claim" value="—" delta="Upload Healthcare CSV" tooltip="Average paid amount per claim." />

                        <KpiCard label="Denial rate" value="—" delta="Upload Healthcare CSV" tooltip="Percent denied via flag or status." />
                        <KpiCard label="High-cost share" value="—" delta="Upload Healthcare CSV" tooltip="Percent above high-cost threshold." />
                        <KpiCard label="Unique patients" value="—" delta="Upload Healthcare CSV" tooltip="Distinct patients in valid data." />
                        <KpiCard label="Top-10 provider share" value="—" delta="Upload Healthcare CSV" tooltip="Paid concentration in top 10 providers." />
                      </div>
                    )
              ) : houseDomain.toLowerCase().includes("supply") ? (
                    supplyKPIs ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Shipments" value={supplyKPIs.shipments_count.toLocaleString("en-US")} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Valid shipment rows counted." />
                        <KpiCard label="Total units" value={supplyKPIs.total_units.toLocaleString("en-US")} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Sum of units across shipments." />
                        <KpiCard label="Avg units / shipment" value={supplyKPIs.avg_units_per_shipment.toFixed(2)} delta="Efficiency" hasData animateKey={activeClient} tooltip="Average units per shipment." />
                        <KpiCard label="On-time delivery" value={`${supplyKPIs.on_time_delivery_rate.toFixed(2)}%`} delta="On-time / total" hasData animateKey={activeClient} tooltip="Percent of shipments delivered on or before expected date." />

                        <KpiCard label="Delay rate" value={`${supplyKPIs.delay_rate.toFixed(2)}%`} delta="Late / total" hasData animateKey={activeClient} tooltip="Percent of shipments delivered after expected date." />
                        <KpiCard label="Avg delay (days)" value={supplyKPIs.avg_delay_days.toFixed(2)} delta="Lead time" hasData animateKey={activeClient} tooltip="Average delay in days (late shipments only)." />
                        <KpiCard label="Unique SKUs" value={supplyKPIs.unique_skus.toLocaleString("en-US")} delta="Distinct sku" hasData animateKey={activeClient} tooltip="Distinct SKU/product identifiers." />
                        <KpiCard label="Unique locations" value={supplyKPIs.unique_locations.toLocaleString("en-US")} delta="Distinct origin/destination" hasData animateKey={activeClient} tooltip="Distinct location identifiers." />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Shipments" value="—" delta="Upload Supply Chain CSV" tooltip="Valid shipment rows counted." />
                        <KpiCard label="Total units" value="—" delta="Upload Supply Chain CSV" tooltip="Sum of units across shipments." />
                        <KpiCard label="Avg units / shipment" value="—" delta="Upload Supply Chain CSV" tooltip="Average units per shipment." />
                        <KpiCard label="On-time delivery" value="—" delta="Upload Supply Chain CSV" tooltip="Percent delivered on/before expected date." />

                        <KpiCard label="Delay rate" value="—" delta="Upload Supply Chain CSV" tooltip="Percent delivered after expected date." />
                        <KpiCard label="Avg delay (days)" value="—" delta="Upload Supply Chain CSV" tooltip="Average delay in days." />
                        <KpiCard label="Unique SKUs" value="—" delta="Upload Supply Chain CSV" tooltip="Distinct SKU/product identifiers." />
                        <KpiCard label="Unique locations" value="—" delta="Upload Supply Chain CSV" tooltip="Distinct locations." />
                      </div>
                    )
              ) : houseDomain.toLowerCase().includes("finance") ? (
                    financeKPIs ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Total inflow" value={formatCurrency(financeKPIs.total_inflow)} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Total incoming (credit) value." />
                        <KpiCard label="Total outflow" value={formatCurrency(financeKPIs.total_outflow)} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Total outgoing (debit) value." />
                        <KpiCard label="Net cash flow" value={formatCurrency(financeKPIs.net_cash_flow)} delta="Inflow - Outflow" hasData animateKey={activeClient} tooltip="Inflow minus outflow." />
                        <KpiCard label="Transactions" value={financeKPIs.txn_count.toLocaleString("en-US")} delta="All valid datasets" hasData animateKey={activeClient} tooltip="Valid transactions processed." />

                        <KpiCard label="Avg txn amount" value={formatCurrency(financeKPIs.avg_txn_amount)} delta="Avg abs(amount)" hasData animateKey={activeClient} tooltip="Average per transaction." />
                        <KpiCard label="Unique accounts" value={financeKPIs.unique_accounts.toLocaleString("en-US")} delta="Distinct IDs" hasData animateKey={activeClient} tooltip="Distinct accounts/customers." />
                        <KpiCard label="Fraud rate" value={`${financeKPIs.fraud_rate.toFixed(2)}%`} delta="Flagged / total" hasData animateKey={activeClient} tooltip="Percent flagged as fraud/suspicious." />
                        <KpiCard label="High-value share" value={`${financeKPIs.high_value_txn_share.toFixed(2)}%`} delta=">= $10k" hasData animateKey={activeClient} tooltip="Percent above high-value threshold." />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Total inflow" value="—" delta="Upload Finance CSV" tooltip="Total incoming (credit) value." />
                        <KpiCard label="Total outflow" value="—" delta="Upload Finance CSV" tooltip="Total outgoing (debit) value." />
                        <KpiCard label="Net cash flow" value="—" delta="Upload Finance CSV" tooltip="Inflow minus outflow." />
                        <KpiCard label="Transactions" value="—" delta="Upload Finance CSV" tooltip="Valid transactions processed." />

                        <KpiCard label="Avg txn amount" value="—" delta="Upload Finance CSV" tooltip="Average per transaction." />
                        <KpiCard label="Unique accounts" value="—" delta="Upload Finance CSV" tooltip="Distinct accounts/customers." />
                        <KpiCard label="Fraud rate" value="—" delta="Upload Finance CSV" tooltip="Percent flagged as fraud/suspicious." />
                        <KpiCard label="High-value share" value="—" delta="Upload Finance CSV" tooltip="Percent above high-value threshold." />
                      </div>
                )
              ) : houseDomain.toLowerCase().includes("saas") || houseDomain.toLowerCase().includes("subscription") ? (
                    saasKPIs ?(
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard
                        label="MRR"
                        value={saasKPIs ? formatCurrency(saasKPIs.mrr) : "—"}
                        delta={saasReady ? "All valid datasets" : "Upload SaaS CSV"}
                        hasData={saasReady}
                        animateKey={activeClient}
                        tooltip="Monthly recurring revenue from active subscriptions."
                      />

                      <KpiCard
                        label="Subscription events"
                        value={saasKPIs ? saasRowsAllValid.length.toLocaleString("en-US") : "—"}
                        delta={saasReady ? "All valid datasets" : "Upload SaaS CSV"}
                        hasData={saasReady}
                        animateKey={activeClient}
                        tooltip="Count of valid subscription or invoice records."
                      />

                      <KpiCard
                        label="Active customers"
                        value={saasKPIs ? saasKPIs.active_customers.toLocaleString("en-US") : "—"}
                        delta={saasReady ? "Latest month" : "Upload SaaS CSV"}
                        hasData={saasReady}
                        animateKey={activeClient}
                        tooltip="Distinct paying customers in the latest billing period."
                      />

                      <KpiCard
                        label="Customer churn"
                        value={saasKPIs ? `${saasKPIs.customer_churn_rate.toFixed(1)}%` : "—"}
                        delta={saasReady ? "Prev vs current" : "Upload SaaS CSV"}
                        hasData={saasReady}
                        animateKey={activeClient}
                        tooltip="Percentage of customers lost compared to the previous period."
                      />

                      <KpiCard
                        label="ARPU"
                        value={saasKPIs ? formatCurrency(saasKPIs.arpu) : "—"}
                        delta={saasReady ? "MRR / active" : "Upload SaaS CSV"}
                        hasData={saasReady}
                        premium
                        isPro={isPro}
                        onUpgrade={() => router.push("/pricing")}
                        animateKey={activeClient}
                        tooltip="Average recurring revenue per active customer."
                      />

                      <KpiCard
                        label="Revenue churn"
                        value={saasKPIs ? `${saasKPIs.revenue_churn_rate.toFixed(1)}%` : "—"}
                        delta={saasReady ? "Lost + contraction" : "Upload SaaS CSV"}
                        hasData={saasReady}
                        animateKey={activeClient}
                        tooltip="Revenue lost due to churned and downgraded customers."
                      />

                      <KpiCard
                        label="Expansion rate"
                        value={saasKPIs ? `${saasKPIs.expansion_rate.toFixed(1)}%` : "—"}
                        delta={saasReady ? "Growth from upsells" : "Upload SaaS CSV"}
                        hasData={saasReady}
                        animateKey={activeClient}
                        tooltip="Revenue growth from upgrades and expansions."
                      />

                      <KpiCard
                        label="Top-10 revenue share"
                        value={saasKPIs ? `${saasKPIs.top10_revenue_share.toFixed(1)}%` : "—"}
                        delta={saasReady ? "Concentration" : "Upload SaaS CSV"}
                        hasData={saasReady}
                        premium
                        isPro={isPro}
                        onUpgrade={() => router.push("/pricing")}
                        animateKey={activeClient}
                        tooltip="Share of recurring revenue generated by the top 10 customers."
                      />
                    </div>
                  ):(
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                      label="MRR"
                      value="—"
                      delta="Upload SaaS dataset"
                      tooltip="Monthly recurring revenue from active subscriptions."
                    />

                    <KpiCard
                      label="Subscription events"
                      value="—"
                      delta="Upload SaaS dataset"
                      tooltip="Count of valid subscription or invoice records."
                    />

                    <KpiCard
                      label="Active customers"
                      value="—"
                      delta="Upload SaaS dataset"
                      tooltip="Distinct paying customers in the latest billing period."
                    />

                    <KpiCard
                      label="Customer churn"
                      value="—"
                      delta="Upload SaaS dataset"
                      tooltip="Percentage of customers lost compared to the previous period."
                    />

                    <KpiCard
                      label="ARPU"
                      value="—"
                      delta="Upload SaaS dataset"
                      premium
                      isPro={isPro}
                      onUpgrade={() => router.push("/pricing")}
                      tooltip="Average recurring revenue per active customer."
                    />

                    <KpiCard
                      label="Revenue churn"
                      value="—"
                      delta="Upload SaaS dataset"
                      premium
                      isPro={isPro}
                      onUpgrade={() => router.push("/pricing")}
                      tooltip="Revenue lost due to churned and downgraded customers."
                    />

                    <KpiCard
                      label="Expansion rate"
                      value="—"
                      delta="Upload SaaS dataset"
                      tooltip="Revenue growth from upgrades and expansions."
                    />

                    <KpiCard
                      label="Top-10 revenue share"
                      value="—"
                      delta="Upload SaaS dataset"
                      premium
                      isPro={isPro}
                      onUpgrade={() => router.push("/pricing")}
                      tooltip="Share of recurring revenue generated by the top 10 customers."
                    />
                  </div>
                  )
                ) : ( // E-commerce (All valid datasets)
                isEcom ? (
                  ecommerceKPIs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard
                        label="Total revenue"
                        value={formatCurrency(ecommerceKPIs.total_revenue)}
                        delta="All valid datasets"
                        hasData
                        animateKey={activeClient}
                        tooltip="Total revenue generated from all completed orders."
                      />
                      <KpiCard
                        label="Orders"
                        value={ecommerceKPIs.orders_count.toLocaleString("en-US")}
                        delta="All valid datasets"
                        hasData
                        animateKey={activeClient}
                        tooltip="Total number of valid customer orders."
                      />
                      <KpiCard
                        label="AOV"
                        value={formatCurrency(ecommerceKPIs.avg_order_value)}
                        delta="Revenue / orders"
                        hasData
                        animateKey={activeClient}
                        tooltip="Average revenue per order."
                      />
                      <KpiCard
                        label="Revenue (last 30d)"
                        value={formatCurrency(ecommerceKPIs.revenue_last_30d)}
                        delta="Momentum"
                        hasData
                        animateKey={activeClient}
                        tooltip="Revenue generated from orders in the last 30 days."
                      />

                      <KpiCard
                        label="Unique customers"
                        value={ecommerceKPIs.unique_customers.toLocaleString("en-US")}
                        delta="All valid datasets"
                        hasData
                        animateKey={activeClient}
                        tooltip="Number of distinct customers who placed orders."
                      />
                      <KpiCard
                        label="Repeat rate"
                        value={`${ecommerceKPIs.repeat_customer_rate.toFixed(1)}%`}
                        delta="Repeat / total"
                        hasData
                        animateKey={activeClient} tooltip="Percentage of customers who placed more than one order."
                      />
                      <KpiCard
                        label="Revenue / customer"
                        value={formatCurrency(ecommerceKPIs.avg_revenue_per_customer)}
                        delta="Avg per customer"
                        hasData
                        animateKey={activeClient} tooltip="Average revenue generated per customer."
                      />
                      <KpiCard
                        label="At-risk revenue"
                        value={formatCurrency(ecommerceKPIs.at_risk_revenue)}
                        delta="Inactive >60d"
                        positive={false}
                        hasData
                        animateKey={activeClient} tooltip="Revenue tied to customers inactive for more than 60 days."
                      />
                    </div>
                    
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard label="Total revenue" value="—" delta="Upload E-commerce CSV" tooltip="Total revenue generated from all completed orders." />
                      <KpiCard label="Orders" value="—" delta="Upload E-commerce CSV" tooltip="Total number of valid customer orders."/>
                      <KpiCard label="AOV" value="—" delta="Upload E-commerce CSV" tooltip="Average revenue per order."/>
                      <KpiCard label="Revenue (last 30d)" value="—" delta="Upload E-commerce CSV" tooltip="Revenue generated from orders in the last 30 days."/>

                      <KpiCard label="Unique customers" value="—" delta="Upload E-commerce CSV" tooltip="Number of distinct customers who placed orders."/>
                      <KpiCard label="Repeat rate" value="—" delta="Upload E-commerce CSV" tooltip="Percentage of customers who placed more than one order."/>
                      <KpiCard label="Revenue / customer" value="—" delta="Upload E-commerce CSV" tooltip="Average revenue generated per customer."/>
                      <KpiCard label="At-risk revenue" value="—" delta="Upload E-commerce CSV" tooltip="Revenue tied to customers inactive for more than 60 days."/>
                    </div>
                  )
                ) : null
              )} 
            </section>

            {/* --- Finance diagnostics summary --- */}
              
              {!isEcom && financeDomain && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-100">Finance diagnostics summary</div>
                      <div className="text-[11px] text-slate-400">
                        {hasData ? "Aggregated from all valid Finance datasets" : "Preview mode (upload Finance CSVs to activate)"}
                      </div>
                    </div>

                    <span
                      className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full border",
                        hasData ? "border-emerald-400/50 text-emerald-200 bg-emerald-500/10" : "border-slate-700 text-slate-300 bg-slate-900/50"
                      )}
                    >
                      {hasData ? "Active" : "Preview"}
                    </span>
                  </div>

                  {/* Row 1 — Flow & Risk */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Cash flow direction (keep your existing UI) */}
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Cash flow direction</span>
                        <div className="inline-flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${flowStatus.dotClass}`} />
                          <span className={`text-[11px] font-medium ${flowStatus.textClass}`}>{flowStatus.label}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">{hasData ? financeFlowDirection : "—"}</div>
                      <div className="mt-1 text-[10px] text-slate-500">Based on net cash flow sign</div>
                    </div>
                    
                        

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    {/* Header with badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Inflow / Outflow ratio</span>
                      {financeInflowOutflowStatus ? (
                        <StatusBadge {...financeInflowOutflowStatus} />
                      ) : null}
                    </div>

                    {/* Value */}
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {hasData ? (financeInflowOutflowRatio ?? "—") : "—"}
                    </div>

                    {/* Helper text */}
                    <div className="mt-1 text-[10px] text-slate-500">
                      Higher means inflow dominates
                    </div>
                  </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Risk posture</span>

                        {hasData && (
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]",
                              financeRiskLevel === "Low"
                                ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                                : financeRiskLevel === "Medium"
                                ? "border-amber-400/40 text-amber-200 bg-amber-500/10"
                                : financeRiskLevel === "Elevated"
                                ? "border-rose-400/40 text-rose-200 bg-rose-500/10"
                                : "border-slate-500/40 text-slate-200 bg-slate-800/60"
                            )}
                          >
                            {financeRiskLevel}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500">
                        Composite: fraud + high-value share
                      </div>
                    </div>

                  </div>

                  {/* Row 2 — Exposure & Structure */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Fraud rate</span>

                        {hasData && (
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]",
                              financeFraudRate < 1
                                ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                                : financeFraudRate < 3
                                ? "border-amber-400/40 text-amber-200 bg-amber-500/10"
                                : "border-rose-400/40 text-rose-200 bg-rose-500/10"
                            )}
                          >
                            {financeFraudRate < 1 ? "Low" : financeFraudRate < 3 ? "Watch" : "High"}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {hasData ? `${financeFraudRate.toFixed(2)}%` : "—"}
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500">
                        Flagged via is_fraud or fraud_rule
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">High-value share</span>

                        {hasData && (
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]",
                              financeHighValueShare < 10
                                ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                                : financeHighValueShare < 20
                                ? "border-amber-400/40 text-amber-200 bg-amber-500/10"
                                : "border-rose-400/40 text-rose-200 bg-rose-500/10"
                            )}
                          >
                            {financeHighValueShare < 10
                              ? "Diversified"
                              : financeHighValueShare < 20
                              ? "Concentrated"
                              : "Highly concentrated"}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {hasData ? `${financeHighValueShare.toFixed(2)}%` : "—"}
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500">
                        Transactions above high-value threshold
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Net cash flow</span>

                        {hasData && (
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]",
                              financeNetCashFlow > 0
                                ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                                : financeNetCashFlow < 0
                                ? "border-rose-400/40 text-rose-200 bg-rose-500/10"
                                : "border-slate-700 text-slate-300 bg-slate-900/50"
                            )}
                          >
                            {financeNetCashFlow > 0
                              ? "Positive"
                              : financeNetCashFlow < 0
                              ? "Negative"
                              : "Balanced"}
                          </span>
                        )}
                      </div>

                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {hasData ? formatCurrency(financeNetCashFlow) : "—"}
                        </div>

                        <div className="mt-1 text-[10px] text-slate-500">
                          Total inflow minus outflow
                        </div>
                      </div>
                  </div>

                  {/* Row 3 — Coverage & Stability */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Transaction velocity</span>

                        {hasData && (
                          <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]",
                            financeTxnPerDay >= 50
                              ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                              : financeTxnPerDay >= 10
                              ? "border-amber-400/40 text-amber-200 bg-amber-500/10"
                              : "border-slate-500/40 text-slate-200 bg-slate-800/60"
                          )}
                        >
                          {financeTxnPerDay >= 50
                            ? "High"
                            : financeTxnPerDay >= 10
                            ? "Moderate"
                            : "Low"}
                        </span>
                        )}
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {hasData ? financeTxnPerDay.toFixed(2) : "—"}
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500">
                        Transactions per day (coverage-adjusted)
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Account activity density</span>

                          {hasData && (
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]",
                                financeTxnPerAccount >= 20
                                  ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                                  : financeTxnPerAccount >= 5
                                  ? "border-amber-400/40 text-amber-200 bg-amber-500/10"
                                  : "border-slate-500/40 text-slate-200 bg-slate-800/60"
                              )}
                            >
                              {financeTxnPerAccount >= 20
                                ? "High"
                                : financeTxnPerAccount >= 5
                                ? "Moderate"
                                : "Low"}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {hasData ? financeTxnPerAccount.toFixed(2) : "—"}
                        </div>

                        <div className="mt-1 text-[10px] text-slate-500">
                          Transactions per account
                        </div>
                      </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Time coverage</span>

                          {hasData && (
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]",
                                financeCoverageDays >= 180
                                  ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                                  : financeCoverageDays >= 60
                                  ? "border-amber-400/40 text-amber-200 bg-amber-500/10"
                                  : "border-slate-500/40 text-slate-200 bg-slate-800/60"
                              )}
                            >
                              {financeCoverageDays >= 180
                                ? "Long"
                                : financeCoverageDays >= 60
                                ? "Medium"
                                : "Short"}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {hasData ? `${financeCoverageDays} days` : "—"}
                        </div>

                        <div className="mt-1 text-[10px] text-slate-500">
                          Max transaction date − min transaction date
                        </div>
                      </div>
                  </div>

                  {!hasData && (
                    <div className="text-[11px] text-slate-500">
                      Tip: upload Finance CSVs with txn_date + amount + account_id (optional: is_fraud / fraud_rule).
                    </div>
                  )}
                </div>
              )}


              {/* Insurance diagnostics summary*/}
              {!isEcom && insuranceDomain && insuranceKPIs && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-100">Insurance diagnostics summary</div>
                      <div className="text-[11px] text-slate-400">
                        Aggregated from all valid Insurance datasets
                      </div>
                    </div>

                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-400/50 text-emerald-200 bg-emerald-500/10">
                      Active
                    </span>
                  </div>

                  {/* Row 1 — Loss & Volume */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Underwriting margin</span>
                        {hasData && insuranceMarginStatus && <StatusBadge {...insuranceMarginStatus} />}
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {insuranceKPIs ? `${insuranceUnderwritingMargin.toFixed(1)}%` : "—"}
                      </div>

                      <span className="text-[11px] text-slate-400">
                        100 − loss ratio
                      </span>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Claims frequency</span>
                        {hasData && insuranceFreqStatus && <StatusBadge {...insuranceFreqStatus} />}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {insuranceKPIs ? insuranceClaimsFrequency.toFixed(2) : "—"}
                      </div>
                      <span className="text-[11px] text-slate-400">Claims per policy</span>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Avg severity</span>
                        {hasData && insuranceSeverityStatus && <StatusBadge {...insuranceSeverityStatus} />}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {insuranceKPIs ? formatCurrency(insuranceKPIs.avg_claim_amount) : "—"}
                      </div>
                      <span className="text-[11px] text-slate-400">Average claim amount</span>
                    </div>
                  </div>

                  {/* Row 2 — Tail risk & Concentration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Large-loss share</span>
                        {hasData && insuranceLargeLossStatus && <StatusBadge {...insuranceLargeLossStatus} />}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {insuranceKPIs ? `${insuranceKPIs.high_severity_share.toFixed(1)}%` : "—"}
                      </div>
                      <span className="text-[11px] text-slate-400">Claims ≥ 25k</span>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Policy concentration</span>
                        {hasData && insuranceConcentrationStatus && <StatusBadge {...insuranceConcentrationStatus} />}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {insuranceKPIs ? `${insuranceKPIs.policy_concentration_top10.toFixed(1)}%` : "—"}
                      </div>
                      <span className="text-[11px] text-slate-400">Top-10 policy claim share</span>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Denial pressure</span>
                        {hasData && insuranceDenialStatus && <StatusBadge {...insuranceDenialStatus} />}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {insuranceDenialPressure === null ? "—" : `${insuranceDenialPressure.toFixed(1)}%`}
                      </div>
                      <span className="text-[11px] text-slate-400">Denied / rejected claims</span>
                    </div>
                  </div>

                  {/* Row 3 — Momentum & Retention */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Premium momentum (30d)</span>
                        {hasData && insurancePremiumMomentumStatus && <StatusBadge {...insurancePremiumMomentumStatus} />}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {insurancePremiumMomentumPct === null ? "—" : `${insurancePremiumMomentumPct.toFixed(1)}%`}
                      </div>
                      <span className="text-[11px] text-slate-400">Last 30d vs prior 30d</span>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Retention proxy</span>
                        {hasData && insuranceRetentionStatus && <StatusBadge {...insuranceRetentionStatus} />}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {insuranceRetentionProxy === null ? "—" : `${insuranceRetentionProxy.toFixed(1)}%`}
                      </div>
                      <span className="text-[11px] text-slate-400">Policies active in last 60d</span>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Time coverage</span>
                        {hasData && insuranceCoverageStatus && <StatusBadge {...insuranceCoverageStatus} />}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {insuranceKPIs ? `${insuranceCoverageDays} days` : "—"}
                      </div>
                      <span className="text-[11px] text-slate-400">Max − min date</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Tip: best results with claim_amount + policy_id (optional: premium, claim_status, is_fraud / fraud_rule).
                  </div>
                </div>
              )}

              {/* E-commerce diagnostics summary*/}
                {(houseDomain.toLowerCase().includes("e-comm") || houseDomain.toLowerCase().includes("ecommerce")) && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-100">E-commerce diagnostics summary</div>
                        <div className="text-[11px] text-slate-400">
                          {ecommerceReady ? "Aggregated from all valid E-commerce datasets" : "Preview mode (upload E-commerce CSVs to activate)"}
                        </div>
                      </div>

                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full border",
                          ecommerceReady ? "border-emerald-400/50 text-emerald-200 bg-emerald-500/10" : "border-slate-700 text-slate-300 bg-slate-900/50"
                        )}
                      >
                        {ecommerceReady ? "Active" : "Preview"}
                      </span>
                    </div>

                    {/* Row 1 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Momentum</span>
                          {hasData && ecommerceMomentumStatus ? <StatusBadge {...ecommerceMomentumStatus} /> : null}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {ecommerceKPIs ? `${ecommerceRecentShare.toFixed(1)}%` : "—"}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">Revenue share from last 30 days</div>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Loyalty</span>
                          {hasData && ecommerceRepeatStatus ? <StatusBadge {...ecommerceRepeatStatus} /> : null}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {ecommerceKPIs ? `${ecommerceKPIs.repeat_customer_rate.toFixed(1)}%` : "—"}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">Repeat customer rate</div>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Concentration</span>
                          {hasData && ecommerceConcentrationStatus ? <StatusBadge {...ecommerceConcentrationStatus} /> : null}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {ecommerceKPIs ? `${ecommerceKPIs.top10_customer_revenue_share.toFixed(1)}%` : "—"}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">Top-10 customers revenue share</div>
                      </div>
                    </div>

                    {/* Row 2 (new) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">Orders / customer</span>
                           {hasData && ecommerceOrdersPerCustomerStatus ? <StatusBadge {...ecommerceOrdersPerCustomerStatus} /> : null}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {ecommerceKPIs ? ecommerceKPIs.avg_orders_per_customer.toFixed(2) : "—"}
                        </div>
                        <span className="text-[11px] text-slate-400">Avg orders per unique customer</span>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Inactive customers</span>
                        {hasData && ecommerceInactiveStatus && (<StatusBadge {...ecommerceInactiveStatus} />)}
                      </div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {ecommerceKPIs ? `${ecommerceKPIs.inactive_customer_share.toFixed(1)}%` : "—"}
                        </div>
                        <span className="text-[11px] text-slate-400">No orders in &gt;60 days</span>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Top-1 customer share</span>
                        {hasData && ecommerceTop1Status && (<StatusBadge {...ecommerceTop1Status} />)}
                      </div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {ecommerceKPIs ? `${ecommerceKPIs.top1_customer_revenue_share.toFixed(1)}%` : "—"}
                        </div>
                        <span className="text-[11px] text-slate-400">Revenue concentration (top customer)</span>
                      </div>

                    </div>

                    {/* Row 3 (new) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Top-3 customer share</span>
                        {hasData && ecommerceTop3Status && (<StatusBadge {...ecommerceTop3Status} />)}
                      </div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {ecommerceKPIs ? `${ecommerceKPIs.top3_customer_revenue_share.toFixed(1)}%` : "—"}
                        </div>
                        <span className="text-[11px] text-slate-400">Revenue concentration (top 3)</span>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Revenue / customer trend</span>
                        {hasData && ecommerceRpcTrendStatus && (<StatusBadge {...ecommerceRpcTrendStatus} />)}
                      </div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {ecommerceKPIs ? `${ecommerceKPIs.rev_per_customer_change_pct_30d.toFixed(1)}%` : "—"}
                        </div>
                        <span className="text-[11px] text-slate-400">Last 30d vs previous 30d</span>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Weekly order volatility</span>
                        {hasData && ecommerceVolatilityStatus && (<StatusBadge {...ecommerceVolatilityStatus} />)}
                      </div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">
                          {ecommerceKPIs ? ecommerceKPIs.weekly_order_volatility_cv.toFixed(2) : "—"}
                        </div>
                        <span className="text-[11px] text-slate-400">Std / mean (higher = unstable)</span>
                      </div>

                    </div>

                    {!ecommerceReady && (
                      <div className="text-[11px] text-slate-500">
                        Tip: upload/select a CSV with order_date + revenue + customer_id (optional: product_id + quantity).
                      </div>
                    )}
                  </div>
                )}


              {/* Supply Chain diagnostics summary */}
              
              {houseDomain.toLowerCase().includes("supply") && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-100">Supply Chain diagnostics summary</div>
                    <div className="text-[11px] text-slate-400">
                      {supplyKPIs
                        ? "Aggregated from all valid Supply Chain datasets"
                        : "Preview mode (upload Supply Chain CSVs to activate)"}
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full border",
                      supplyKPIs
                        ? "border-emerald-400/50 text-emerald-200 bg-emerald-500/10"
                        : "border-slate-700 text-slate-300 bg-slate-900/50"
                    )}
                  >
                    {supplyKPIs ? "Active" : "Preview"}
                  </span>
                </div>

                {/* Row 1 — Reliability & Delay */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Delivery reliability</span>
                      {supplyKPIs && scReliabilityStatus ? <StatusBadge {...scReliabilityStatus} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {supplyKPIs ? `${supplyKPIs.on_time_delivery_rate.toFixed(2)}%` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">On-time delivery rate</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Delay pressure</span>
                      {supplyKPIs && scDelayPressureStatus ? <StatusBadge {...scDelayPressureStatus} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {supplyKPIs ? `${supplyKPIs.delay_rate.toFixed(2)}%` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Late shipments share</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Delay severity</span>
                      {supplyKPIs && scDelaySeverityStatus ? <StatusBadge {...scDelaySeverityStatus} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {supplyKPIs ? `${supplyKPIs.avg_delay_days.toFixed(2)} days` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Average delay duration</div>
                  </div>
                </div>

                {/* Row 2 — Exposure & Load */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">High-delay exposure</span>
                      {supplyKPIs && scHighDelayStatus ? <StatusBadge {...scHighDelayStatus} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {supplyKPIs ? `${supplyKPIs.high_delay_share.toFixed(2)}%` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Delays above threshold</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Shipment intensity</span>
                      {supplyKPIs && scIntensityStatus ? <StatusBadge {...scIntensityStatus} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {supplyKPIs ? supplyShipmentsPerDay.toFixed(2) : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Shipments per day</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Unit density</span>
                      {supplyKPIs && scUnitDensityStatus ? <StatusBadge {...scUnitDensityStatus} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {supplyKPIs ? supplyKPIs.avg_units_per_shipment.toFixed(2) : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Avg units per shipment</div>
                  </div>
                </div>

                {/* Row 3 — Complexity & Coverage */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">SKU complexity</span>
                      {supplyKPIs && scSkuStatus ? <StatusBadge {...scSkuStatus} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {supplyKPIs ? supplyShipmentsPerSku.toFixed(2) : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Shipments per SKU</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Location dispersion</span>
                      {supplyKPIs && scLocationStatus ? <StatusBadge {...scLocationStatus} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {supplyKPIs ? supplyShipmentsPerLocation.toFixed(2) : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Shipments per location</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Time coverage</span>
                      {supplyKPIs && scCoverageStatus ? <StatusBadge {...scCoverageStatus} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {supplyKPIs ? `${supplyCoverageDays} days` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Max date − min date</div>
                  </div>
                </div>

                {!supplyKPIs && (
                  <div className="text-[11px] text-slate-500">
                    Tip: best results with shipment_id + sku + units + expected_delivery_date + actual_delivery_date (+ origin/destination).
                  </div>
                )}
              </div>
            )}

            {/*SaaS diagnostics summary*/}

            {houseDomain.toLowerCase().includes("saas") && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-100">SaaS diagnostics summary</div>
                    <div className="text-[11px] text-slate-400">
                      {saasKPIs ? "Aggregated from all valid SaaS datasets" : "Preview mode"}
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full border",
                      saasKPIs
                        ? "border-emerald-400/50 text-emerald-200 bg-emerald-500/10"
                        : "border-slate-700 text-slate-300 bg-slate-900/50"
                    )}
                  >
                    {saasKPIs ? "Active" : "Preview"}
                  </span>
                </div>

                {/* Row 1 — Churn / Growth / ARPU */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Customer churn</span>
                      {hasData && saasChurnStatus && <StatusBadge {...saasChurnStatus} />}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {saasKPIs ? `${Number(saasKPIs.customer_churn_rate ?? 0).toFixed(2)}%` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Customers churned / active</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">MRR growth</span>
                      {hasData && saasGrowthStatus && <StatusBadge {...saasGrowthStatus} />}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {saasKPIs ? `${Number(saasKPIs.mrr_growth_rate ?? 0).toFixed(2)}%` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Current vs previous month</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">ARPU</span>
                      {hasData && saasArpuStatus && <StatusBadge {...saasArpuStatus} />}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {saasKPIs ? formatCurrency(Number(saasKPIs.arpu ?? 0)) : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">MRR / active customers</div>
                  </div>
                </div>

                {/* Row 2 — Revenue churn / NRR / Customer base */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Revenue churn</span>
                      {hasData && saasRevenueChurnStatus && <StatusBadge {...saasRevenueChurnStatus} />}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {saasKPIs ? `${Number(saasKPIs.revenue_churn_rate ?? 0).toFixed(2)}%` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Churned MRR / previous MRR</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">NRR proxy</span>
                      {hasData && saasNRRStatus && <StatusBadge {...saasNRRStatus} />}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {saasKPIs ? `${saasNRR.toFixed(1)}%` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      100 + expansion − contraction − revenue churn
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Active customers</span>
                      {hasData && saasCustomerBaseStatus && <StatusBadge {...saasCustomerBaseStatus} />}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {saasKPIs ? Number(saasKPIs.active_customers ?? 0).toLocaleString("en-US") : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Paying accounts</div>
                  </div>
                </div>

                {/* Row 3 — Expansion / Concentration / MRR */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Expansion rate</span>
                      {hasData && saasKPIs ? <StatusBadge {...saasExpansionBadge(Number(saasKPIs.expansion_rate ?? 0))} /> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {saasKPIs ? `${Number(saasKPIs.expansion_rate ?? 0).toFixed(2)}%` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Expansion MRR / previous MRR</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Top-10 revenue share</span>
                      {hasData && saasConcentrationStatus && <StatusBadge {...saasConcentrationStatus} />}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {saasKPIs ? `${Number(saasKPIs.top10_revenue_share ?? 0).toFixed(1)}%` : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Revenue concentration risk</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="text-[11px] text-slate-400">MRR</div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {saasKPIs ? formatCurrency(Number(saasKPIs.mrr ?? 0)) : "—"}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Monthly recurring revenue</div>
                  </div>
                </div>
              </div>
            )}

            {/* Healthcare diagnostics summary */}
            {houseDomain.toLowerCase().includes("health") && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-100">Healthcare diagnostics summary</div>
                  <div className="text-[11px] text-slate-400">
                    {healthcareKPIs ? "Aggregated from all valid Healthcare datasets" : "Preview mode (upload Healthcare CSVs to activate)"}
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full border",
                    healthcareKPIs
                      ? "border-emerald-400/50 text-emerald-200 bg-emerald-500/10"
                      : "border-slate-700 text-slate-300 bg-slate-900/50"
                  )}
                >
                  {healthcareHasData ? "Active" : "No Data"}
                </span>
              </div>

              {/* Row 1 — Pressure & Structure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Denial pressure</span>
                    {healthcareHasData && healthcareDenialStatus ? <StatusBadge {...healthcareDenialStatus} /> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {healthcareKPIs ? `${healthcareKPIs.denial_rate.toFixed(1)}%` : "—"}
                  </div>
                  <span className="text-[11px] text-slate-400">Denied claims share</span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Billing efficiency</span>
                    {healthcareHasData && hcBillingEfficiencyStatus ? <StatusBadge {...hcBillingEfficiencyStatus} /> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {healthcareKPIs ? `${billingEfficiency.toFixed(1)}%` : "—"}
                  </div>
                  <span className="text-[11px] text-slate-400">Paid ÷ charged</span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Provider concentration</span>
                    {healthcareHasData && healthcareProviderStatus ? <StatusBadge {...healthcareProviderStatus} /> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {healthcareKPIs ? `${healthcareKPIs.provider_concentration_top10.toFixed(1)}%` : "—"}
                  </div>
                  <span className="text-[11px] text-slate-400">Top-10 provider paid share</span>
                </div>
              </div>

              {/* Row 2 — Intensity & Utilization */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">High-cost intensity</span>
                    {healthcareHasData && healthcareHighCostStatus ? <StatusBadge {...healthcareHighCostStatus} /> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {healthcareKPIs ? `${healthcareKPIs.high_cost_share.toFixed(1)}%` : "—"}
                  </div>
                  <span className="text-[11px] text-slate-400">Claims above cost threshold</span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Claims per patient</span>
                    {healthcareHasData && hcClaimsPerPatientStatus ? <StatusBadge {...hcClaimsPerPatientStatus} /> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {healthcareKPIs ? avgClaimsPerPatient.toFixed(2) : "—"}
                  </div>
                  <span className="text-[11px] text-slate-400">Utilization depth</span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Paid per patient</span>
                    {healthcareHasData && hcPaidPerPatientStatus ? <StatusBadge {...hcPaidPerPatientStatus} /> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {healthcareKPIs ? formatCurrency(hcPaidPerPatient) : "—"}
                  </div>
                  <span className="text-[11px] text-slate-400">Total paid ÷ unique patients</span>
                </div>
              </div>

              {/* Row 3 — Pricing & Denial Burden */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Charge per claim</span>
                    {healthcareHasData && hcChargePerClaimStatus ? <StatusBadge {...hcChargePerClaimStatus} /> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {healthcareKPIs ? formatCurrency(hcChargePerClaim) : "—"}
                  </div>
                  <span className="text-[11px] text-slate-400">Total charged ÷ claims</span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Denial burden</span>
                    {healthcareHasData && hcDenialBurdenStatus ? <StatusBadge {...hcDenialBurdenStatus} /> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {healthcareKPIs ? formatCurrency(hcDenialBurden) : "—"}
                  </div>
                  <span className="text-[11px] text-slate-400">Estimated denied dollars (proxy)</span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Paid-to-charge gap</span>
                    {healthcareHasData && hcPaidChargeGapStatus ? <StatusBadge {...hcPaidChargeGapStatus} /> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {healthcareKPIs ? `${hcPaidChargeGapPct.toFixed(1)}%` : "—"}
                  </div>
                  <span className="text-[11px] text-slate-400">Gap % = 1 − (paid ÷ charged)</span>
                </div>
              </div>

            </div>
          )}
              


              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/90 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-medium text-slate-100">Revenue trend by month</span>
                    <span>{hasData ? "From uploaded data" : "Demo period"}</span>
                  </div>
                  <RevenueChart points={chartPoints} />
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs flex flex-col">
                  <div className="font-medium text-slate-100 mb-2">
                    AI-generated insights {hasData ? "(from uploaded data)" : "(waiting for data)"}
                  </div>
                  <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "18rem" }}>
                    {insights.map((ins) => (
                      <InsightItem key={ins.title} title={ins.title} body={ins.body} />
                    ))}
                  </div>
                </div>
              </div>
            

            {Object.keys(datasets).length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 mt-4">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-medium text-slate-100">Datasets in this workspace</span>
                  <span className="text-[11px] text-slate-400">
                    {Object.keys(datasets).length} dataset{Object.keys(datasets).length > 1 ? "s" : ""} loaded
                  </span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                        <th className="text-left px-2 py-2">Client</th>
                        <th className="text-left px-2 py-2">Key</th>
                        <th className="text-right px-2 py-2">Rows</th>
                        <th className="text-left px-2 py-2">Uploaded at</th>
                        <th className="text-left px-2 py-2">Status</th>
                        <th className="text-right px-2 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(datasets).map(([key, ds]) => {
                      const missing = ds?.issues?.missing ?? [];
                      const ready = missing.length === 0;

                      return (
                        <tr key={key} className="border-t border-slate-900/70 hover:bg-slate-900/60">
                          <td className="px-2 py-2 text-slate-100">{ds.displayName}</td>
                          <td className="px-2 py-2 text-[11px] text-slate-500">{key}</td>
                          <td className="px-2 py-2 text-right text-slate-200">{ds.rowCount.toLocaleString("en-US")}</td>
                          <td className="px-2 py-2 text-[11px] text-slate-400">{new Date(ds.uploadedAt).toLocaleString()}</td>

                          <td className="px-2 py-2 text-[11px]">
                            {ready ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-400/40 text-emerald-200 bg-emerald-500/10">
                                ✓ Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-400/40 text-amber-200 bg-amber-500/10">
                                ⚠ Needs columns
                              </span>
                            )}
                          </td>

                          <td className="px-2 py-2 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                disabled={!ready}
                                className={cn(
                                  "px-2 py-1 rounded-lg border text-[11px]",
                                  !ready
                                    ? "border-slate-800 text-slate-600 bg-slate-950 cursor-not-allowed"
                                    : activeClient === key
                                    ? "border-emerald-400 text-emerald-300 bg-emerald-500/10"
                                    : "border-slate-700 text-slate-200 bg-slate-900/80 hover:bg-slate-800"
                                )}
                                onClick={() => {
                                  if (!ready) return;
                                  handleSetActiveClient(key);
                                }}
                                title={!ready ? `Missing: ${missing.join(", ")}` : ""}
                              >
                                {activeClient === key ? "Active" : "Set active"}
                              </button>

                              <button
                                className="px-2 py-1 rounded-lg border border-rose-500/60 text-[11px] text-rose-300 bg-rose-500/10 hover:bg-rose-500/20"
                                onClick={() => handleRemoveDataset(key)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}



/* ---- Small helper components ---- */


function domainBadgeClasses(domain: string) {
  const d = domain.toLowerCase();

  if (d.includes("finance") || d.includes("bank"))
    return "border-blue-500/40 bg-blue-500/10 text-blue-200 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.35)]";

  if (d.includes("insurance"))
    return "border-indigo-500/40 bg-indigo-500/10 text-rose-200 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35)]";

  if (d.includes("health"))
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.35)]";

  if (d.includes("supply"))
    return "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.35)]";

  if (d.includes("saas"))
    return "border-purple-500/40 bg-purple-500/10 text-purple-200 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.35)]";

  if (d.includes("e-comm") || d.includes("ecommerce"))
    return "border-cyan-400/40 bg-cyan-400/10 text-cyan-200 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)]";

  return "border-slate-700 bg-slate-900/70 text-slate-200";
}

function StatusBadge({ label, cls }: Badge) {
  const map: Record<string, string> = {
    emerald: "border-emerald-400/40 text-emerald-200 bg-emerald-500/10",
    amber: "border-amber-400/40 text-amber-200 bg-amber-500/10",
    rose: "border-rose-400/40 text-rose-200 bg-rose-500/10",
    slate: "border-slate-700 text-slate-300 bg-slate-900/50",
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]", map[cls] ?? map.slate)}>
      {label}
    </span>
  );
}

function SidebarItem({ label, active, targetId }: { label: string; active?: boolean; targetId?: string }) {
  function handleClick() {
    if (targetId && typeof document !== "undefined") {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }




  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between",
        active ? "bg-slate-900 text-slate-50" : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100"
      )}
    >
      <span>{label}</span>
    </button>
  );
}

function KpiCard({
  label,
  value,
  delta,
  tooltip,
  positive = true,
  hasData = false,
  premium = false,
  isPro = false,
  onUpgrade,
  animateKey,
}: {
  label: string;
  value: string;
  delta: string;
  tooltip?: string;
  positive?: boolean;
  hasData?: boolean;
  premium?: boolean;
  isPro?: boolean;
  onUpgrade?: () => void;
  animateKey?: string | null;
}) {
  const [pulse, setPulse] = React.useState(false);

  React.useEffect(() => {
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 260);
    return () => window.clearTimeout(t);
  }, [animateKey, value]);

  const locked = premium && !isPro;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-1 transition-all duration-300",
        pulse && "ring-1 ring-cyan-400/30 scale-[1.01]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-slate-400">{label}</div>

          {tooltip ? (
            <span
              className="inline-flex items-center justify-center h-4 w-4 rounded-full border border-slate-700 text-[10px] text-slate-300 bg-slate-900/60"
              title={tooltip}
            >
              i
            </span>
          ) : null}
        </div>

        {locked ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/10 text-[10px] text-amber-200 hover:bg-amber-500/15"
            title="Upgrade to unlock this KPI"
          >
            🔒 Upgrade
          </button>
        ) : premium ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-[10px] text-emerald-200">
            PRO
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("text-lg font-semibold text-slate-50", locked && "blur-[2px] select-none")}>
          {locked ? "••••" : value}
        </span>

        <span className={cn("text-[11px] font-medium", positive ? "text-emerald-300" : "text-rose-300")}>
          {positive ? "▲" : "▼"} {delta}
        </span>
      </div>

      <div className="text-[10px] text-slate-500">
        {locked
          ? "Premium KPI — upgrade to view"
          : hasData
          ? "Calculated from your uploaded dataset"
          : "Demo values — upload data to activate"}
      </div>
    </div>
  )
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="text-sm text-slate-100">{value}</div>
      <div className="text-[11px] text-slate-500">{hint}</div>
    </div>
  );
}

function InsightItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-slate-800 rounded-lg p-2.5 bg-slate-950/80">
      <div className="text-[11px] font-semibold text-slate-100 mb-1">{title}</div>
      <div className="text-[11px] text-slate-400 leading-snug">{body}</div>
    </div>
  );
}

function RevenueChart({ points }: { points: ChartPoint[] }) {
  if (!points || points.length === 0) {
    return (
      <div className="h-70 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-500">
        No data yet — upload a CSV with a date and revenue column to see the trend.
      </div>
    );
  }

  const maxRevenue = Math.max(...points.map((p) => p.revenue), 0) || 1;

  return (
    <div className="h-70 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 flex flex-col justify-between">
      <div className="flex-1 flex items-end justify-between gap-2">
        {points.map((p) => {
          const heightPx = Math.max(12, (p.revenue / maxRevenue) * 140);
          return (
            <div key={p.label} className="flex flex-col items-center justify-end gap-1 flex-1">
              <div
                className="w-3/4 rounded-md bg-cyan-400/80 border border-cyan-300/60"
                style={{ height: `${heightPx}px` }}
              />
              <div className="text-[10px] text-slate-400 text-center whitespace-nowrap">{p.label}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[10px] text-slate-500">
        Bars show total revenue by month (scaled to the highest month).
      </div>
    </div>
  );
}