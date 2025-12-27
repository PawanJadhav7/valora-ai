import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SQL = `
  select day, inflow, outflow, net
  from kpi.v_finance_cashflow_daily_30d
  order by day;
`;

export async function GET() {
  try {
    const { rows } = await pool.query(SQL);

    // ⬇️ PLACE IT HERE (after rows, before return)
    const series = rows.map((r: any) => ({
      day: new Date(r.day).toISOString().slice(0, 10), // YYYY-MM-DD
      inflow: Number(r.inflow ?? 0),
      outflow: Number(r.outflow ?? 0),
      net: Number(r.net ?? 0),
    }));

    return NextResponse.json({ series }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load finance cashflow series",
        message: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}