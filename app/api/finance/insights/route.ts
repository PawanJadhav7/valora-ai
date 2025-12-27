import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL_KPIS = `
  select inflow_30d, outflow_30d, net_cash_flow_30d
  from kpi.v_finance_kpis
  limit 1;
`;

const SQL_DAILY = `
  select day, inflow, outflow, net
  from kpi.v_finance_cashflow_daily_30d
  order by day;
`;

const SQL_CATS = `
  select category, inflow, outflow, net, txn_count
  from kpi.v_finance_top_categories_30d;
`;

const SQL_CP = `
  select counterparty, inflow, outflow, net, txn_count
  from kpi.v_finance_top_counterparties_30d;
`;

export async function GET() {
  try {
    const [kpisRes, dailyRes, catsRes, cpRes] = await Promise.all([
      pool.query(SQL_KPIS),
      pool.query(SQL_DAILY),
      pool.query(SQL_CATS),
      pool.query(SQL_CP),
    ]);

    return NextResponse.json(
      {
        kpis: kpisRes.rows?.[0] ?? null,
        daily: dailyRes.rows ?? [],
        topCategories: catsRes.rows ?? [],
        topCounterparties: cpRes.rows ?? [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load finance insights", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}