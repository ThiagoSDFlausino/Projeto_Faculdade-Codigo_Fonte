import { getDb } from "../../../../src/db.js";
import { omitId, omitMany } from "../../../../src/utils.js";
import { Cliente } from "../Cliente/Cliente.js";

const col = (name) => getDb().collection(name);

/** Persistência e mapeamento da entidade Cliente e dados relacionados. */
export const ClienteRepository = {
  async findAll() {
    const rows = omitMany(
      await col("clientes").find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray(),
    );
    return rows.map((row) => new Cliente(row));
  },

  async findById(id) {
    const row = omitId(await col("clientes").findOne({ id }, { projection: { _id: 0 } }));
    return row ? new Cliente(row) : null;
  },

  async insert(cliente) {
    await col("clientes").insertOne(cliente.toDocument());
    return cliente;
  },

  async update(id, data) {
    await col("clientes").updateOne({ id }, { $set: data });
    return this.findById(id);
  },

  async delete(id) {
    await Promise.all([
      "sessoes", "anamneses", "appointments", "gallery", "notas_cliente", "lembretes",
      "avaliacoes_cliente", "interacoes_cliente",
    ].map((c) => col(c).deleteMany({ cliente_id: id })));
    return col("clientes").deleteOne({ id });
  },

  async findRelated(clienteId, { sessQ, apptQ }) {
    return Promise.all([
      col("anamneses").find({ cliente_id: clienteId }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray(),
      col("sessoes").find(sessQ, { projection: { _id: 0 } }).sort({ date: -1 }).toArray(),
      col("appointments").find(apptQ, { projection: { _id: 0 } }).sort({ datetime: -1 }).toArray(),
      col("gallery").find({ cliente_id: clienteId }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray(),
      col("notas_cliente").find({ cliente_id: clienteId }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray(),
      col("lembretes").find({ cliente_id: clienteId }, { projection: { _id: 0 } }).sort({ data_vencimento: 1 }).toArray(),
      col("avaliacoes_cliente").find({ cliente_id: clienteId }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray(),
      col("interacoes_cliente").find({ cliente_id: clienteId }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray(),
    ]);
  },

  insertAnamnese(doc) { return col("anamneses").insertOne(doc); },
  async findAnamnese(id) { return omitId(await col("anamneses").findOne({ id }, { projection: { _id: 0 } })); },
  updateAnamnese(id, data) { return col("anamneses").updateOne({ id }, { $set: data }); },
  deleteAnamnese(id) { return col("anamneses").deleteOne({ id }); },

  insertSessao(doc) { return col("sessoes").insertOne(doc); },
  async findSessao(id) { return omitId(await col("sessoes").findOne({ id }, { projection: { _id: 0 } })); },
  updateSessao(id, data) { return col("sessoes").updateOne({ id }, { $set: data }); },
  deleteSessao(id) { return col("sessoes").deleteOne({ id }); },

  insertGallery(doc) { return col("gallery").insertOne(doc); },
  async findGallery(id) { return omitId(await col("gallery").findOne({ id }, { projection: { _id: 0 } })); },
  updateGallery(id, data) { return col("gallery").updateOne({ id }, { $set: data }); },
  deleteGallery(id) { return col("gallery").deleteOne({ id }); },

  insertNota(doc) { return col("notas_cliente").insertOne(doc); },
  async findNota(id) { return omitId(await col("notas_cliente").findOne({ id }, { projection: { _id: 0 } })); },
  updateNota(id, data) { return col("notas_cliente").updateOne({ id }, { $set: data }); },
  deleteNota(id) { return col("notas_cliente").deleteOne({ id }); },

  insertLembrete(doc) { return col("lembretes").insertOne(doc); },
  async findLembrete(id) { return omitId(await col("lembretes").findOne({ id }, { projection: { _id: 0 } })); },
  updateLembrete(id, data) { return col("lembretes").updateOne({ id }, { $set: data }); },
  deleteLembrete(id) { return col("lembretes").deleteOne({ id }); },

  insertAvaliacao(doc) { return col("avaliacoes_cliente").insertOne(doc); },
  async findAvaliacao(id) { return omitId(await col("avaliacoes_cliente").findOne({ id }, { projection: { _id: 0 } })); },
  updateAvaliacao(id, data) { return col("avaliacoes_cliente").updateOne({ id }, { $set: data }); },
  deleteAvaliacao(id) { return col("avaliacoes_cliente").deleteOne({ id }); },

  insertInteracao(doc) { return col("interacoes_cliente").insertOne(doc); },
  async findInteracao(id) { return omitId(await col("interacoes_cliente").findOne({ id }, { projection: { _id: 0 } })); },
  updateInteracao(id, data) { return col("interacoes_cliente").updateOne({ id }, { $set: data }); },
  deleteInteracao(id) { return col("interacoes_cliente").deleteOne({ id }); },
};
