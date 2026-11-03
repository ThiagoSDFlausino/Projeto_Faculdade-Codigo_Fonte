import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Driver SQLite local via node:sqlite (sem binário nativo extra). */
export function createSqliteDriver(dbPath) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA journal_mode = WAL");
  } catch {
    /* memory */
  }

  return {
    async exec(sql) {
      db.exec(sql);
    },
    async all(sql, params = []) {
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    },
    async run(sql, params = []) {
      const stmt = db.prepare(sql);
      const info = stmt.run(...params);
      return {
        changes: info.changes ?? 0,
        lastInsertRowid: info.lastInsertRowid,
      };
    },
    async close() {
      db.close();
    },
  };
}
export function migrationSql() {
  const file = path.join(__dirname, "../../migrations/0001_init.sql");
  return fs.readFileSync(file, "utf8");
}

