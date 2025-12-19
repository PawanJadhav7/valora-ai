// app/lib/kpis/ecommerce.ts

export type TopProduct = {
  product_id: string;
  revenue: number;
  units: number;
};

export type EcommerceKPIs = {
  //core metrics
  total_revenue: number;
  orders_count: number;
  avg_order_value: number;

  //customer metrics
  unique_customers: number;
  repeat_customer_rate: number;
  avg_revenue_per_customer: number;

  //recency / risk metrics
  new_customers_30d: number;
  returning_customers_30d: number;
  revenue_last_30d: number;
  at_risk_revenue: number;

  //concentration metrics
  top10_customer_revenue_share: number;
  top_products: TopProduct[];

  avg_orders_per_customer: number;            // orders / unique customers
  inactive_customer_share: number;            // % customers inactive >60d
  top1_customer_revenue_share: number;        // top-1 revenue share %
  top3_customer_revenue_share: number;        // top-3 revenue share %
  rev_per_customer_change_pct_30d: number;    // RPC trend vs previous 30d
  weekly_order_volatility_cv: number;         // volatility (std/mean) weekly orders

};

function toNumber(x: any): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function toDate(x: any): Date | null {
  if (!x) return null;
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d;
}

function firstValue(row: any, keys: string[]) {
  for (const k of keys) {
    if (row?.[k] != null) return row[k];
  }
  return null;
}

function pickId(row: any, keys: string[]): string | null {
  const v = firstValue(row, keys);
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}



// app/lib/kpis/ecommerce.ts
// Comment: Collects rows only from datasets that passed validation

export function collectValidRowsForEcommerce(
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

function weekKey(d: Date) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function computeEcommerceKPIs(rawData: any[]): EcommerceKPIs {
  const empty: EcommerceKPIs = {
    total_revenue: 0,
    orders_count: 0,
    avg_order_value: 0,
    revenue_last_30d: 0,

    unique_customers: 0,
    repeat_customer_rate: 0,
    avg_revenue_per_customer: 0,
    new_customers_30d: 0,
    returning_customers_30d: 0,

    top10_customer_revenue_share: 0,
    at_risk_revenue: 0,

    top_products: [],
    avg_orders_per_customer: 0,
    inactive_customer_share: 0,
    top1_customer_revenue_share: 0,
    top3_customer_revenue_share: 0,
    rev_per_customer_change_pct_30d: 0,
    weekly_order_volatility_cv: 0,
  };

  if (!rawData?.length) return empty;

  const revenueKeys = ["revenue", "amount", "sales", "total", "netrevenue"];
  const dateKeys = ["order_date", "date", "orderDate", "OrderDate"];
  const customerKeys = ["customer_id", "customerId", "customer", "CustomerID", "Customer"];
  const productKeys = ["product_id", "productId", "sku", "SKU", "ProductID"];
  const qtyKeys = ["quantity", "qty", "units"];

  let maxDate: Date | null = null;

  // customer aggregates
  const customerOrders = new Map<string, number>();
  const customerRevenue = new Map<string, number>();
  const customerFirst = new Map<string, Date>();
  const customerLast = new Map<string, Date>();

  // product aggregates
  const productAgg = new Map<string, { revenue: number; units: number }>();

  // revenue / orders
  let totalRevenue = 0;
  let ordersCount = 0;

  // pass 1: parse rows
  const parsedRows: Array<{ d: Date; cust: string | null; revenue: number; prod: string; qty: number }> = [];

  for (const row of rawData) {
    const d = toDate(firstValue(row, dateKeys));
    if (d && (!maxDate || d > maxDate)) maxDate = d;

    const cust = pickId(row, customerKeys);
    const revenue = toNumber(firstValue(row, revenueKeys));
    const prod = pickId(row, productKeys) ?? "Unknown";

    const qtyRaw = firstValue(row, qtyKeys);
    const qty = Math.max(1, toNumber(qtyRaw));

    if (revenue > 0) {
      totalRevenue += revenue;
      ordersCount += 1;
    }

    parsedRows.push({ d: d ?? new Date(0), cust, revenue: Math.max(0, revenue), prod, qty });
  }

  if (!maxDate || ordersCount === 0) {
    return { ...empty, total_revenue: totalRevenue, orders_count: ordersCount };
  }

  // pass 2: build customer + product maps
  for (const p of parsedRows) {
    if (p.cust && p.revenue > 0) {
      customerOrders.set(p.cust, (customerOrders.get(p.cust) ?? 0) + 1);
    }

    if (p.cust) {
      
      customerRevenue.set(p.cust, (customerRevenue.get(p.cust) ?? 0) + p.revenue);

      const prevFirst = customerFirst.get(p.cust);
      if (!prevFirst || p.d < prevFirst) customerFirst.set(p.cust, p.d);

      const prevLast = customerLast.get(p.cust);
      if (!prevLast || p.d > prevLast) customerLast.set(p.cust, p.d);
    }

    const agg = productAgg.get(p.prod) ?? { revenue: 0, units: 0 };
    agg.revenue += p.revenue;
    agg.units += p.qty;
    productAgg.set(p.prod, agg);
  }

  const uniqueCustomers = customerOrders.size;
  const repeatCount = Array.from(customerOrders.values()).filter((c) => c > 1).length;

  const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;
  const avgRevenuePerCustomer = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
  const repeatCustomerRate = uniqueCustomers > 0 ? (repeatCount / uniqueCustomers) * 100 : 0;
  const avgOrdersPerCustomer = uniqueCustomers > 0 ? ordersCount / uniqueCustomers : 0;

  // last 30d + at-risk (inactive >60d)
  const msPerDay = 1000 * 60 * 60 * 24;
  const recentDays = 30;
  const atRiskDays = 60;

  let revenueLast30 = 0;
  let atRiskRevenue = 0;

  for (const p of parsedRows) {
    if (!Number.isFinite(p.revenue) || p.revenue <= 0) continue;
    const diffDays = (maxDate.getTime() - p.d.getTime()) / msPerDay;
    if (diffDays >= 0 && diffDays <= recentDays) revenueLast30 += p.revenue;
  }

  for (const [cust, last] of customerLast.entries()) {
    const diffDays = (maxDate.getTime() - last.getTime()) / msPerDay;
    if (diffDays >= atRiskDays) atRiskRevenue += customerRevenue.get(cust) ?? 0;
  }

  // new vs returning in last 30d
  let newCustomers30 = 0;
  let returningCustomers30 = 0;

  for (const [cust, first] of customerFirst.entries()) {
    const last = customerLast.get(cust) ?? first;

    const diffLast = (maxDate.getTime() - last.getTime()) / msPerDay;
    const diffFirst = (maxDate.getTime() - first.getTime()) / msPerDay;

    if (diffLast >= 0 && diffLast <= recentDays) {
      const oc = customerOrders.get(cust) ?? 0;
      if (oc === 1 && diffFirst <= recentDays) newCustomers30 += 1;
      else returningCustomers30 += 1;
    }
  }

  // top10 customer revenue share
  const top10CustomerShare = (() => {
    if (totalRevenue <= 0) return 0;
    const arr = Array.from(customerRevenue.entries()).sort((a, b) => b[1] - a[1]);
    const top = arr.slice(0, 10).reduce((s, [, v]) => s + v, 0);
    return (top / totalRevenue) * 100;
  })();

  const top1Top3Shares = (() => {
  if (totalRevenue <= 0) return { top1: 0, top3: 0 };
  const arr = Array.from(customerRevenue.entries()).sort((a, b) => b[1] - a[1]);
  const top1 = arr.slice(0, 1).reduce((s, [, v]) => s + v, 0);
  const top3 = arr.slice(0, 3).reduce((s, [, v]) => s + v, 0);
  return {
    top1: (top1 / totalRevenue) * 100,
    top3: (top3 / totalRevenue) * 100,
  };
})();

const last30Start = maxDate.getTime() - 30 * msPerDay;
const prev30Start = maxDate.getTime() - 60 * msPerDay;

let revCur30 = 0;
let revPrev30 = 0;
const custCur30 = new Set<string>();
const custPrev30 = new Set<string>();

for (const p of parsedRows) {
  if (!p.cust || p.revenue <= 0) continue;
  const t = p.d.getTime();

  if (t >= last30Start && t <= maxDate.getTime()) {
    revCur30 += p.revenue;
    custCur30.add(p.cust);
  } else if (t >= prev30Start && t < last30Start) {
    revPrev30 += p.revenue;
    custPrev30.add(p.cust);
  }
}

const rpcCur30 = custCur30.size > 0 ? revCur30 / custCur30.size : 0;
const rpcPrev30 = custPrev30.size > 0 ? revPrev30 / custPrev30.size : 0;

const revPerCustomerChangePct30d =
  rpcPrev30 > 0 ? ((rpcCur30 - rpcPrev30) / rpcPrev30) * 100 : 0;



const weeklyOrders = new Map<string, number>();
for (const p of parsedRows) {
  if (!p.d || p.d.getTime() === new Date(0).getTime()) continue;
  const wk = weekKey(p.d);
  weeklyOrders.set(wk, (weeklyOrders.get(wk) ?? 0) + 1);
}

const counts = Array.from(weeklyOrders.values());
const mean = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
const variance = counts.length
  ? counts.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / counts.length
  : 0;
const std = Math.sqrt(variance);
const weeklyOrderVolatilityCv = mean > 0 ? std / mean : 0;

  // top products
  const topProducts = Array.from(productAgg.entries())
    .map(([product_id, v]) => ({ product_id, revenue: v.revenue, units: v.units }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  let inactiveCustomers = 0;

for (const [, last] of customerLast.entries()) {
  const diffDays = (maxDate.getTime() - last.getTime()) / msPerDay;
  if (diffDays >= atRiskDays) inactiveCustomers += 1;
}



const inactiveCustomerShare = uniqueCustomers > 0 ? (inactiveCustomers / uniqueCustomers) * 100 : 0;

  return {
    total_revenue: totalRevenue,
    orders_count: ordersCount,
    avg_order_value: avgOrderValue,
    revenue_last_30d: revenueLast30,

    unique_customers: uniqueCustomers,
    repeat_customer_rate: repeatCustomerRate,
    avg_revenue_per_customer: avgRevenuePerCustomer,
    new_customers_30d: newCustomers30,
    returning_customers_30d: returningCustomers30,

    top10_customer_revenue_share: top10CustomerShare,
    at_risk_revenue: atRiskRevenue,

    top_products: topProducts,
    avg_orders_per_customer: avgOrdersPerCustomer,
    inactive_customer_share: inactiveCustomerShare,
    top1_customer_revenue_share: top1Top3Shares.top1,
    top3_customer_revenue_share: top1Top3Shares.top3,
    rev_per_customer_change_pct_30d: revPerCustomerChangePct30d,
    weekly_order_volatility_cv: weeklyOrderVolatilityCv,
  };
}