import { getDb } from "../../../src/db.js";
import { omitId, omitMany } from "../../../src/utils.js";
import { Usuario } from "../Usuario/Usuario.js";

const users = () => getDb().collection("users");

export const UsuarioRepository = {
  count() {
    return users().countDocuments();
  },

  async findByEmail(email) {
    const row = omitId(await users().findOne({ email }, { projection: { _id: 0 } }));
    return row ? new Usuario(row) : null;
  },

  async findById(id) {
    const row = omitId(await users().findOne({ id }, { projection: { _id: 0 } }));
    return row ? new Usuario(row) : null;
  },

  async findAll() {
    const rows = omitMany(
      await users().find({}, { projection: { _id: 0, password_hash: 0 } }).toArray(),
    );
    return rows.map((row) => new Usuario(row));
  },

  async findActiveByRole(role) {
    const rows = omitMany(
      await users().find(
        { role, active: { $ne: false } },
        { projection: { _id: 0, password_hash: 0 } },
      ).toArray(),
    );
    return rows.map((row) => new Usuario(row));
  },

  async insert(usuario) {
    await users().insertOne(usuario.toDocument());
    return usuario;
  },

  async update(id, data) {
    await users().updateOne({ id }, { $set: data });
    return this.findById(id);
  },

  delete(id) {
    return users().deleteOne({ id });
  },
};
