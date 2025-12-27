import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL = `
  select
    txn_date::date as day,
    txn_id,
    category,
    counterparty,
    direction,
    amount,
    memo
  from raw_finance_cashflow
  where txn_date::date = $1::date
  order by amount desc
  limit 25;
`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");
    if (!day) return NextResponse.json({ error: "Missing day" }, { status: 400 });

    const { rows } = await pool.query(SQL, [day]);
    return NextResponse.json({ day, txns: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load anomaly transactions", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}