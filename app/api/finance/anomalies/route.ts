import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL = `
  select day, inflow, outflow, avg_outflow_14d, sd_outflow_14d, outflow_ratio, outflow_z, is_anomaly
  from kpi.v_finance_anomalies_daily_30d
  order by day;
`;

export async function GET() {
  try {
    const { rows } = await pool.query(SQL);
    return NextResponse.json({ daily: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load finance anomalies", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}