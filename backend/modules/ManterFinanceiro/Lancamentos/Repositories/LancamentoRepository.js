import { getDb } from "../../../../src/db.js";
import { omitId, omitMany } from "../../../../src/utils.js";
import { Lancamento } from "../Lancamento/Lancamento.js";

const transactions = () => getDb().collection("transactions");

/** Persistência e mapeamento da entidade Lancamento. */
export const LancamentoRepository = {
  async findAll() {
    const rows = omitMany(
      await transactions().find({}, { projection: { _id: 0 } }).sort({ due_date: -1 }).toArray(),
    );
    return rows.map((row) => new Lancamento(row));
  },

  async findById(id) {
    const row = omitId(await transactions().findOne({ id }, { projection: { _id: 0 } }));
    return row ? new Lancamento(row) : null;
  },

  async insert(lancamento) {
    await transactions().insertOne(lancamento.toDocument());
    return lancamento;
  },

  async update(id, data) {
    await transactions().updateOne({ id }, { $set: data });
    return this.findById(id);
  },

  delete(id) {
    return transactions().deleteOne({ id });
  },
};
