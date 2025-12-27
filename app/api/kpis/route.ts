import { NextResponse } from "next/server";
import { Pool } from "pg";



export const runtime = "nodejs"; // required for pg in Next.js (not Edge)
console.log("DATABASE_URL =", process.env.DATABASE_URL);

// Create pool AFTER logging
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If you're on local Postgres without SSL, leave it.
  // If you later deploy to managed Postgres, you may need ssl:
  // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

const SQL = `
  select kpis_json
  from kpi.v_kpi_bundle_json
`;

export async function GET() {
  try {
    const { rows } = await pool.query(SQL);

    // Your view returns exactly 1 row with jsonb
    const kpis = rows?.[0]?.kpis_json ?? {};

    return NextResponse.json(kpis, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to load KPIs",
        message: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}