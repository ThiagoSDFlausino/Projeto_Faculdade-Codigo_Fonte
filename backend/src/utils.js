import { v4 as uuid } from "uuid";

export const id = () => uuid();

export const nowIso = () => new Date().toISOString();

export const todayStr = () => new Date().toISOString().slice(0, 10);

export function omitId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

export function omitMany(docs) {
  return (docs || []).map(omitId);
}

export function httpError(status, detail) {
  const err = new Error(detail);
  err.status = status;
  err.detail = detail;
  return err;
}
