import { Pool } from "pg";

declare global {
  // prevent hot-reload creating new pools
  // eslint-disable-next-line no-var
  var __valoraPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool =
  global.__valoraPool ??
  new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") global.__valoraPool = pool;