import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

// This script runs standalone via tsx (npm run db:migrate), outside of the
// Next.js dev/build process, so it needs to load env files itself. Reuse
// @next/env (bundled with `next`) so env resolution matches what the Next.js
// app itself would load: apps/web/.env* first, then a repo-root .env as a
// convenience fallback for the monorepo's shared .env.example convention.
function loadEnv() {
  loadEnvConfig(path.resolve(__dirname, "../../.."), false);
  loadEnvConfig(path.resolve(__dirname, "../../../../.."), false);
}

async function main() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const schemaPath = path.resolve(__dirname, "../../../db/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  try {
    console.log(`Running migration from ${schemaPath} ...`);
    await pool.query(sql);
    console.log("Migration complete.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exitCode = 1;
});
