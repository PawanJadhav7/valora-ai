import { NextResponse } from "next/server";

export async function GET() {
  console.log("DB URL:", process.env.DATABASE_URL);

  return NextResponse.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlStartsWith: process.env.DATABASE_URL?.slice(0, 15) ?? null,
  });
}