/** Colunas tipadas por tabela + documento JSON completo em `data`. */

export const COLLECTION_TABLES = [
  "users",
  "clientes",
  "sessoes",
  "anamneses",
  "appointments",
  "transactions",
  "gallery",
  "procedures",
  "notas_cliente",
  "lembretes",
  "avaliacoes_cliente",
  "interacoes_cliente",
  "fechamentos",
];

const TABLE_SET = new Set(COLLECTION_TABLES);

/** Campos espelhados em colunas SQL (além de id / data). */
export const COLUMN_MAP = {
  users: ["email", "name", "role", "active"],
  clientes: ["name", "phone", "email", "status", "created_at"],
  sessoes: ["cliente_id", "professional_id", "date", "fechamento_id"],
  anamneses: ["cliente_id", "created_at"],
  appointments: ["cliente_id", "professional_id", "datetime", "status"],
  transactions: ["type", "status", "due_date", "paid_date", "cliente_id", "amount"],
  gallery: ["cliente_id", "created_at"],
  procedures: ["name", "active"],
  notas_cliente: ["cliente_id", "created_at"],
  lembretes: ["cliente_id", "data_vencimento"],
  avaliacoes_cliente: ["cliente_id", "created_at"],
  interacoes_cliente: ["cliente_id", "created_at"],
  fechamentos: ["periodo_inicio", "periodo_fim", "created_at"],
};

export function assertCollection(name) {
  if (!TABLE_SET.has(name)) {
    throw new Error(`Coleção desconhecida: ${name}`);
  }
  return name;
}

function sqlValue(col, doc) {
  const v = doc[col];
  if (v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v !== null && typeof v === "object") return JSON.stringify(v);
  return v;
}

export function rowToDoc(row) {
  if (!row) return null;
  const doc = typeof row.data === "string" ? JSON.parse(row.data) : { ...row.data };
  if (!doc.id) doc.id = row.id;
  return doc;
}

export function buildUpsert(collection, doc) {
  assertCollection(collection);
  const cols = COLUMN_MAP[collection] || [];
  const names = ["id", ...cols, "data"];
  const placeholders = names.map(() => "?").join(", ");
  const updates = cols.map((c) => `${c} = excluded.${c}`);
  updates.push("data = excluded.data");
  const values = [
    doc.id,
    ...cols.map((c) => sqlValue(c, doc)),
    JSON.stringify(doc),
  ];
  const sql = `INSERT INTO ${collection} (${names.join(", ")}) VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET ${updates.join(", ")}`;
  return { sql, values };
}
