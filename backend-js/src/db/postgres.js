import pg from "pg";
import { COLLECTION_TABLES } from "./schema.js";

const { Pool } = pg;

function toPostgres(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

function connectionHost(connectionString) {
  const normalized = connectionString.replace(/^postgres(ql)?:/i, "http:");
  return new URL(normalized).hostname;
}

export function createPostgresDriver(connectionString) {
  const host = connectionHost(connectionString);
  const useSsl = /supabase\.(co|com)/i.test(host) || process.env.DATABASE_SSL === "1";
  const pool = new Pool({
    connectionString,
    max: 10,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

  console.log("Postgres conectado:", host);

  return {
    async exec(sql) {
      await pool.query(sql);
    },
    async all(sql, params = []) {
      const result = await pool.query(toPostgres(sql), params);
      return result.rows;
    },
    async run(sql, params = []) {
      const result = await pool.query(toPostgres(sql), params);
      return { changes: result.rowCount ?? 0 };
    },
    async close() {
      await pool.end();
    },
  };
}

export async function securePublicTables(driver) {
  const roles = await driver.all(
    "SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')",
  );
  for (const table of COLLECTION_TABLES) {
    await driver.exec(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    for (const role of roles) {
      await driver.exec(`REVOKE ALL ON TABLE ${table} FROM ${role.rolname}`);
    }
  }
}
