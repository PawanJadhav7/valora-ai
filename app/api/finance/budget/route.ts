import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL = `
  select month, budget_outflow, actual_outflow, variance, variance_pct
  from kpi.v_finance_budget_vs_actual_12m
  order by month;
`;

export async function GET() {
  try {
    const { rows } = await pool.query(SQL);
    return NextResponse.json({ monthly: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load budget vs actual", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}