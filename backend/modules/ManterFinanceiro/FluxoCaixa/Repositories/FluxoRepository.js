import { getDb } from "../../../../src/db.js";
import { omitMany } from "../../../../src/utils.js";

const col = (name) => getDb().collection(name);

/** Persistência usada pelo Fluxo de Caixa. */
export const FluxoRepository = {
  async findTransactions() {
    return omitMany(await col("transactions").find({}, { projection: { _id: 0 } }).toArray());
  },

  async findSessoes() {
    return omitMany(await col("sessoes").find({}, { projection: { _id: 0 } }).toArray());
  },
};
