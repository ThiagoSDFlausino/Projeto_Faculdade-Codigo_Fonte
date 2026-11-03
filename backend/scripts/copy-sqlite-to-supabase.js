import "dotenv/config";
import path from "node:path";
import { createSqliteDriver } from "../src/db/sqlite.js";
import { createPostgresDriver, securePublicTables } from "../src/db/postgres.js";
import { applyMigrations } from "../src/db.js";
import { COLLECTION_TABLES } from "../src/db/schema.js";

const sqlitePath = path.resolve(process.cwd(), "data", "dev.sqlite");
const pgUrl = (process.env.DATABASE_URL || "").trim();
if (!/^postgres(ql)?:\/\//i.test(pgUrl)) {
  throw new Error("DATABASE_URL Postgres ausente");
}

const sqlite = createSqliteDriver(sqlitePath);
const postgres = createPostgresDriver(pgUrl);

await applyMigrations(postgres);

const totals = [];
for (const table of COLLECTION_TABLES) {
  let rows = [];
  try {
    rows = await sqlite.all(`SELECT * FROM ${table}`);
  } catch {
    rows = [];
  }
  await postgres.exec(`TRUNCATE TABLE ${table}`);
  for (const row of rows) {
    const cols = Object.keys(row);
    const values = cols.map((col) => row[col]);
    const placeholders = cols.map(() => "?").join(", ");
    const updates = cols.filter((col) => col !== "id").map((col) => `${col} = excluded.${col}`);
    const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updates.join(", ")}`;
    await postgres.run(sql, values);
  }
  totals.push(`${table}:${rows.length}`);
}

await securePublicTables(postgres);
await sqlite.close();
await postgres.close();
console.log(totals.join(" "));
