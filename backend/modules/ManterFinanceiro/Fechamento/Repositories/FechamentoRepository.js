import { getDb } from "../../../../src/db.js";
import { omitId, omitMany } from "../../../../src/utils.js";
import { Fechamento } from "../Fechamento/Fechamento.js";

const col = (name) => getDb().collection(name);

/** Persistência e mapeamento da entidade Fechamento. */
export const FechamentoRepository = {
  async findAll() {
    const rows = omitMany(
      await col("fechamentos").find({}, { projection: { _id: 0 } })
        .sort({ periodo_inicio: -1, created_at: -1 })
        .toArray(),
    );
    return rows.map((row) => new Fechamento(row));
  },

  async findById(id) {
    const row = omitId(await col("fechamentos").findOne({ id }, { projection: { _id: 0 } }));
    return row ? new Fechamento(row) : null;
  },

  async findByPeriodo(periodo_inicio, periodo_fim) {
    const row = omitId(
      await col("fechamentos").findOne({ periodo_inicio, periodo_fim }, { projection: { _id: 0 } }),
    );
    return row ? new Fechamento(row) : null;
  },

  async insert(fechamento) {
    await col("fechamentos").insertOne(fechamento.toDocument());
    return fechamento;
  },

  async delete(id) {
    await col("sessoes").updateMany({ fechamento_id: id }, { $unset: { fechamento_id: "" } });
    return col("fechamentos").deleteOne({ id });
  },

  async findSessoes() {
    return omitMany(await col("sessoes").find({}, { projection: { _id: 0 } }).toArray());
  },

  async findProfissionais() {
    return omitMany(
      await col("users").find({ role: "profissional" }, { projection: { _id: 0 } }).toArray(),
    );
  },

  async findClientesBasico() {
    return omitMany(
      await col("clientes").find({}, { projection: { _id: 0, id: 1, name: 1 } }).toArray(),
    );
  },

  async markSessoes(sessaoIds, fechamentoId) {
    if (!sessaoIds?.length) return;
    return col("sessoes").updateMany(
      { id: { $in: sessaoIds } },
      { $set: { fechamento_id: fechamentoId } },
    );
  },
};
