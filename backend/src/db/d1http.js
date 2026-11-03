/**
 * Driver D1 via HTTP virtual host `http://d1` (outboundByHost no Worker).
 * Protocolo JSON:
 *   POST /query  { sql, params } -> { results: [{...}] }
 *   POST /run    { sql, params } -> { success, meta }
 *   POST /exec   { sql }         -> { success }
 */

const D1_BASE = process.env.D1_HTTP_BASE || "http://my.d1";

async function call(pathname, body) {
  const res = await fetch(`${D1_BASE}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export function createD1HttpDriver() {
  return {
    async exec(sql) {
      await call("/exec", { sql });
    },
    async all(sql, params = []) {
      const data = await call("/query", { sql, params });
      return data.results || [];
    },
    async run(sql, params = []) {
      const data = await call("/run", { sql, params });
      return {
        changes: data.meta?.changes ?? 0,
        lastInsertRowid: data.meta?.last_row_id,
      };
    },
    async close() {},
  };
}
