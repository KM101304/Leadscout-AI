import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL is not configured.");
  process.exit(1);
}

const schemaPath = path.resolve(process.cwd(), "supabase/schema.sql");
const sql = await readFile(schemaPath, "utf8");
const databaseUrl = new URL(connectionString);

const client = new Client({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 5432),
  database: databaseUrl.pathname.replace(/^\//, ""),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  family: 4,
  ssl: {
    rejectUnauthorized: false
  }
});

await client.connect();
await client.query(sql);
await client.end();

console.log(`Applied schema from ${schemaPath}`);
