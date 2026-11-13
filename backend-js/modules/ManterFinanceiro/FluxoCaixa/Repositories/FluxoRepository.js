import { getDb } from "../../../../src/db.js";
import { omitMany } from "../../../../src/utils.js";

const col = (name) => getDb().collection(name);

export const FluxoRepository = {
  async findDespesas() {
    return omitMany(await col("transactions").find({}, { projection: { _id: 0 } }).toArray())
      .filter((t) => t.type === "despesa" || !t.type || t.type !== "receita");
  },

  async findAgendamentos() {
    return omitMany(await col("appointments").find({}, { projection: { _id: 0 } }).toArray());
  },
};
