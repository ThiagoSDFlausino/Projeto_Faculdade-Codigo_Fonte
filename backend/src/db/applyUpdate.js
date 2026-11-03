/** Aplica updates estilo Mongo ($set, $inc, $unset). */

function setPath(obj, path, value) {
  if (!path.includes(".")) {
    obj[path] = value;
    return;
  }
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function unsetPath(obj, path) {
  if (!path.includes(".")) {
    delete obj[path];
    return;
  }
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) return;
    cur = cur[parts[i]];
  }
  delete cur[parts[parts.length - 1]];
}

export function applyUpdate(doc, update) {
  const next = structuredClone(doc);
  if (!update || typeof update !== "object") return next;

  const hasOps = Object.keys(update).some((k) => k.startsWith("$"));
  if (!hasOps) {
    for (const [k, v] of Object.entries(update)) {
      if (k !== "id") next[k] = v;
    }
    return next;
  }

  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) setPath(next, k, v);
  }
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      const cur = Number(next[k] ?? 0);
      setPath(next, k, cur + Number(v));
    }
  }
  if (update.$unset) {
    for (const k of Object.keys(update.$unset)) unsetPath(next, k);
  }
  return next;
}
