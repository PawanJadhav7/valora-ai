import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";



const SQL_GET = `
  select currency, fiscal_start, anomaly_threshold
  from app.finance_settings
  where id = 1;
`;

const SQL_UPSERT = `
  insert into app.finance_settings (id, currency, fiscal_start, anomaly_threshold, updated_at)
  values (1, $1, $2, $3, now())
  on conflict (id) do update
    set currency = excluded.currency,
        fiscal_start = excluded.fiscal_start,
        anomaly_threshold = excluded.anomaly_threshold,
        updated_at = now()
  returning currency, fiscal_start, anomaly_threshold;
`;

export async function GET() {
  try {
    const { rows } = await pool.query(SQL_GET);
    return NextResponse.json({ settings: rows?.[0] ?? null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load finance settings", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const currency = String(body?.currency ?? "USD");
    const fiscal_start = String(body?.fiscal_start ?? "Jan");
    const anomaly_threshold = Number(body?.anomaly_threshold ?? 2);

    const { rows } = await pool.query(SQL_UPSERT, [currency, fiscal_start, anomaly_threshold]);

    return NextResponse.json({ settings: rows?.[0] ?? null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save finance settings", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}