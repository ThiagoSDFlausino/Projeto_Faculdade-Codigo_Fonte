import { getDb } from "./db.js";
import { omitMany } from "./utils.js";

const col = (name) => getDb().collection(name);

/** Recalcula LTV do cliente a partir da soma das sessões (fonte da verdade). */
export async function recalcClienteLtv(clienteId) {
  if (!clienteId) return 0;
  const sessoes = omitMany(await col("sessoes").find({ cliente_id: clienteId }, { projection: { _id: 0, value: 1 } }).toArray());
  const total = Math.round(sessoes.reduce((s, x) => s + (Number(x.value) || 0), 0) * 100) / 100;
  await col("clientes").updateOne({ id: clienteId }, { $set: { total_spent: total } });
  return total;
}

/** Propaga nome (e dados básicos) do cliente para coleções que guardam cópia. */
export async function syncClienteDenormalized(clienteId, { name } = {}) {
  if (!clienteId || !name) return;
  await col("appointments").updateMany({ cliente_id: clienteId }, { $set: { cliente_name: name } });
}
