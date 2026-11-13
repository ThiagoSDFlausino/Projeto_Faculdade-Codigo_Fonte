import { getDb } from "../../../src/db.js";
import { omitId, omitMany } from "../../../src/utils.js";
import { Agendamento } from "../Agendamento/Agendamento.js";

const appointments = () => getDb().collection("appointments");

export const AgendaRepository = {
  async find(filter = {}) {
    const rows = omitMany(
      await appointments().find(filter, { projection: { _id: 0 } }).sort({ datetime: 1 }).toArray(),
    );
    return rows.map((row) => new Agendamento(row));
  },

  async findById(id) {
    const row = omitId(await appointments().findOne({ id }, { projection: { _id: 0 } }));
    return row ? new Agendamento(row) : null;
  },

  async insert(agendamento) {
    await appointments().insertOne(agendamento.toDocument());
    return agendamento;
  },

  async update(id, data) {
    await appointments().updateOne({ id }, { $set: data });
    return this.findById(id);
  },

  delete(id) {
    return appointments().deleteOne({ id });
  },
};
