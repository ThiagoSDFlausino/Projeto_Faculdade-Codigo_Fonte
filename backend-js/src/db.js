import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDbApi } from "./db/collection.js";
import { createD1HttpDriver } from "./db/d1http.js";
import { createPostgresDriver, securePublicTables } from "./db/postgres.js";

const migrationFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "../migrations/0001_init.sql");

export function migrationSql() {
  return fs.readFileSync(migrationFile, "utf8");
}

let driver;
let dbApi;

function resolveSqlitePath() {
  const url = process.env.DATABASE_URL || "";
  if (url === ":memory:" || process.env.NODE_ENV === "test") return ":memory:";
  if (url.startsWith("file:")) return url.slice("file:".length);
  if (url && !url.includes("://")) return url;
  return path.resolve(process.cwd(), "data", "dev.sqlite");
}

export async function connectDb() {
  if (dbApi) return dbApi;

  const mode = (process.env.DATABASE_MODE || "sqlite").toLowerCase();

  if (mode === "d1") {
    driver = createD1HttpDriver();
    console.log("D1 via HTTP (http://my.d1)");
  } else if (mode === "supabase" || mode === "postgres") {
    const url = (process.env.DATABASE_URL || "").trim();
    if (!/^postgres(ql)?:\/\//i.test(url)) {
      throw new Error("DATABASE_MODE=supabase exige DATABASE_URL com a URI do Postgres");
    }
    driver = createPostgresDriver(url);
    await applyMigrations(driver);
    await securePublicTables(driver);
  } else {
    const { createSqliteDriver } = await import("./db/sqlite.js");
    const dbPath = resolveSqlitePath();
    driver = createSqliteDriver(dbPath);
    console.log("SQLite conectado:", dbPath);
    await applyMigrations(driver);
  }

  dbApi = createDbApi(driver);
  return dbApi;
}

export async function applyMigrations(driver) {
  const sql = migrationSql()
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const parts = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of parts) {
    await driver.exec(`${stmt};`);
  }
}

export function getDb() {
  if (!dbApi) throw new Error("DB não conectado");
  return dbApi;
}

export async function closeDb() {
  if (driver?.close) await driver.close();
  driver = null;
  dbApi = null;
}
