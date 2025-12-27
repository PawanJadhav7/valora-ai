import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL_KPIS = `
  select as_of, cash_position_index, avg_daily_outflow, avg_daily_net, min_cash_index, max_cash_index, runway_days
  from kpi.v_finance_liquidity_kpis_30d
  limit 1;
`;

const SQL_DAILY = `
  select day, inflow, outflow, net, cash_position_index
  from kpi.v_finance_liquidity_daily_30d
  order by day;
`;

export async function GET() {
  try {
    const [kpisRes, dailyRes] = await Promise.all([pool.query(SQL_KPIS), pool.query(SQL_DAILY)]);
    return NextResponse.json(
      { kpis: kpisRes.rows?.[0] ?? null, daily: dailyRes.rows ?? [] },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load finance liquidity", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}