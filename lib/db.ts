import { Pool } from "pg";
import { env } from "@/lib/env";

let pool: Pool | null = null;

export function getDb() {
  if (!env.supabaseDatabaseUrl) {
    throw new Error("SUPABASE_DATABASE_URL is not configured.");
  }

  if (!pool) {
    const databaseUrl = new URL(env.supabaseDatabaseUrl);
    pool = new Pool({
      host: databaseUrl.hostname,
      port: Number(databaseUrl.port || 5432),
      database: databaseUrl.pathname.replace(/^\//, ""),
      user: decodeURIComponent(databaseUrl.username),
      password: decodeURIComponent(databaseUrl.password),
      family: 4,
      ssl: {
        rejectUnauthorized: false
      }
    } as any);
  }

  return pool;
}
