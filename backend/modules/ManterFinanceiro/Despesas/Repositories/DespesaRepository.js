import { getDb } from "../../../../src/db.js";
import { omitId, omitMany } from "../../../../src/utils.js";
import { Despesa } from "../Despesa/Despesa.js";

const transactions = () => getDb().collection("transactions");

export const DespesaRepository = {
  async findAll() {
    const rows = omitMany(
      await transactions().find({}, { projection: { _id: 0 } }).sort({ due_date: -1 }).toArray(),
    );
    return rows.map((row) => new Despesa(row));
  },

  async findById(id) {
    const row = omitId(await transactions().findOne({ id }, { projection: { _id: 0 } }));
    return row ? new Despesa(row) : null;
  },

  async insert(despesa) {
    await transactions().insertOne(despesa.toDocument());
    return despesa;
  },

  async update(id, data) {
    await transactions().updateOne({ id }, { $set: data });
    return this.findById(id);
  },

  delete(id) {
    return transactions().deleteOne({ id });
  },
};
