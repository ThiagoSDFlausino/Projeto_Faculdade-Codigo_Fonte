import { matchFilter, projectDoc, sortDocs } from "./match.js";
import { applyUpdate } from "./applyUpdate.js";
import { assertCollection, buildUpsert, rowToDoc } from "./schema.js";

class Cursor {
  constructor(docsPromise, projection) {
    this._docsPromise = docsPromise;
    this._projection = projection;
    this._sort = null;
    this._limit = null;
    this._skip = 0;
  }

  sort(spec) {
    this._sort = spec;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  skip(n) {
    this._skip = n || 0;
    return this;
  }

  project(projection) {
    this._projection = projection;
    return this;
  }

  async toArray() {
    let docs = await this._docsPromise;
    if (this._sort) docs = sortDocs(docs, this._sort);
    if (this._skip) docs = docs.slice(this._skip);
    if (this._limit != null) docs = docs.slice(0, this._limit);
    return docs.map((d) => projectDoc(d, this._projection));
  }

  async next() {
    const [first] = await this.toArray();
    return first || null;
  }
}

export class Collection {
  constructor(driver, name) {
    this.driver = driver;
    this.name = assertCollection(name);
  }

  async _allDocs() {
    const rows = await this.driver.all(`SELECT * FROM ${this.name}`);
    return rows.map(rowToDoc);
  }

  async _save(doc) {
    if (!doc?.id) throw new Error(`Documento sem id em ${this.name}`);
    const { sql, values } = buildUpsert(this.name, doc);
    await this.driver.run(sql, values);
  }

  async _deleteId(id) {
    await this.driver.run(`DELETE FROM ${this.name} WHERE id = ?`, [id]);
  }

  async findOne(filter = {}, options = {}) {
    const docs = await this._allDocs();
    const found = docs.find((d) => matchFilter(d, filter));
    return found ? projectDoc(found, options.projection) : null;
  }

  find(filter = {}, options = {}) {
    const docsPromise = this._allDocs().then((docs) =>
      docs.filter((d) => matchFilter(d, filter)),
    );
    const cursor = new Cursor(docsPromise, options.projection);
    if (options.sort) cursor.sort(options.sort);
    if (options.limit != null) cursor.limit(options.limit);
    if (options.skip) cursor.skip(options.skip);
    return cursor;
  }

  async insertOne(doc) {
    if (!doc?.id) throw new Error(`insertOne exige id em ${this.name}`);
    await this._save(doc);
    return { acknowledged: true, insertedId: doc.id };
  }

  async insertMany(docs) {
    for (const doc of docs) await this.insertOne(doc);
    return { acknowledged: true, insertedCount: docs.length };
  }

  async updateOne(filter, update, options = {}) {
    const docs = await this._allDocs();
    const found = docs.find((d) => matchFilter(d, filter));
    if (!found) {
      if (options.upsert) {
        const base = { id: filter.id || update.$set?.id };
        if (!base.id) throw new Error(`upsert sem id em ${this.name}`);
        const created = applyUpdate(base, update);
        if (update.$setOnInsert) Object.assign(created, update.$setOnInsert);
        await this._save(created);
        return { acknowledged: true, matchedCount: 0, modifiedCount: 1, upsertedId: created.id };
      }
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    }
    const next = applyUpdate(found, update);
    await this._save(next);
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(filter, update) {
    const docs = await this._allDocs();
    const matches = docs.filter((d) => matchFilter(d, filter));
    for (const doc of matches) {
      await this._save(applyUpdate(doc, update));
    }
    return { acknowledged: true, matchedCount: matches.length, modifiedCount: matches.length };
  }

  async deleteOne(filter) {
    const docs = await this._allDocs();
    const found = docs.find((d) => matchFilter(d, filter));
    if (!found) return { acknowledged: true, deletedCount: 0 };
    await this._deleteId(found.id);
    return { acknowledged: true, deletedCount: 1 };
  }

  async deleteMany(filter) {
    const docs = await this._allDocs();
    const matches = docs.filter((d) => matchFilter(d, filter));
    for (const doc of matches) await this._deleteId(doc.id);
    return { acknowledged: true, deletedCount: matches.length };
  }

  async countDocuments(filter = {}) {
    const docs = await this._allDocs();
    return docs.filter((d) => matchFilter(d, filter)).length;
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const docs = await this._allDocs();
    const found = docs.find((d) => matchFilter(d, filter));
    if (!found) return null;
    const next = applyUpdate(found, update);
    await this._save(next);
    const returnAfter = options.returnDocument === "after" || options.returnNewDocument;
    const doc = returnAfter ? next : found;
    return projectDoc(doc, options.projection);
  }
}

export function createDbApi(driver) {
  return {
    collection(name) {
      return new Collection(driver, name);
    },
  };
}
