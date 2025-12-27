import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL_DAILY = `
  select day, revenue
  from kpi.v_finance_revenue_daily_30d
  order by day;
`;

const SQL_CATS = `
  select category, revenue, txn_count
  from kpi.v_finance_revenue_top_categories_30d;
`;

const SQL_CP = `
  select counterparty, revenue, txn_count
  from kpi.v_finance_revenue_top_counterparties_30d;
`;

export async function GET() {
  try {
    const [dailyRes, catsRes, cpRes] = await Promise.all([
      pool.query(SQL_DAILY),
      pool.query(SQL_CATS),
      pool.query(SQL_CP),
    ]);

    return NextResponse.json(
      {
        daily: dailyRes.rows ?? [],
        topCategories: catsRes.rows ?? [],
        topCounterparties: cpRes.rows ?? [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load finance revenue", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}