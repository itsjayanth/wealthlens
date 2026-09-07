import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const schemaPath = path.resolve(__dirname, "../../db/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  const pool = new Pool({ connectionString: databaseUrl });
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
