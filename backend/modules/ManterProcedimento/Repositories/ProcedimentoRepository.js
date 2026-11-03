import { getDb } from "../../../src/db.js";
import { omitId, omitMany } from "../../../src/utils.js";
import { Procedimento } from "../Procedimento/Procedimento.js";

const procedures = () => getDb().collection("procedures");

/** Persistência e mapeamento da entidade Procedimento. */
export const ProcedimentoRepository = {
  async findAll() {
    const rows = omitMany(
      await procedures().find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray(),
    );
    return rows.map((row) => new Procedimento(row));
  },

  async findById(id) {
    const row = omitId(await procedures().findOne({ id }, { projection: { _id: 0 } }));
    return row ? new Procedimento(row) : null;
  },

  async insert(procedimento) {
    await procedures().insertOne(procedimento.toDocument());
    return procedimento;
  },

  async update(id, data) {
    await procedures().updateOne({ id }, { $set: data });
    return this.findById(id);
  },

  delete(id) {
    return procedures().deleteOne({ id });
  },

  async findSessoes() {
    return omitMany(
      await getDb().collection("sessoes").find({}, { projection: { _id: 0 } }).toArray(),
    );
  },

  async findAgendamentosConcluidos() {
    return omitMany(
      await getDb().collection("appointments").find(
        { status: "Concluído" },
        { projection: { _id: 0 } },
      ).toArray(),
    );
  },
};
