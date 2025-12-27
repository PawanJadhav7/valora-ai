import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL_KPIS = `
  select *
  from kpi.v_finance_exposure_kpis_30d
  limit 1;
`;

const SQL_TOP_CP = `
  select counterparty, inflow, outflow, net, txn_count
  from kpi.v_finance_top_counterparties_30d
  order by outflow desc
  limit 10;
`;

export async function GET() {
  try {
    const [k, top] = await Promise.all([pool.query(SQL_KPIS), pool.query(SQL_TOP_CP)]);
    return NextResponse.json(
      { kpis: k.rows?.[0] ?? null, topCounterparties: top.rows ?? [] },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load finance exposure", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}