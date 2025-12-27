import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL_PAST = `
  select day, inflow, outflow, net
  from kpi.v_finance_cashflow_daily_30d
  order by day;
`;

const SQL_FUTURE = `
  select day, inflow_fcst, outflow_fcst, net_fcst
  from kpi.v_finance_forecast_daily_next_30d
  order by day;
`;

export async function GET() {
  try {
    const [past, future] = await Promise.all([pool.query(SQL_PAST), pool.query(SQL_FUTURE)]);
    return NextResponse.json({ past: past.rows ?? [], future: future.rows ?? [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load finance forecast", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}