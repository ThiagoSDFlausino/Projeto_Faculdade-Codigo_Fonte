function getPath(obj, path) {
  if (!path.includes(".")) return obj?.[path];
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function matchOp(value, cond) {
  if (cond == null || typeof cond !== "object" || Array.isArray(cond)) {
    if (Array.isArray(value) && !Array.isArray(cond)) return value.includes(cond);
    return value === cond;
  }
  if (Object.keys(cond).some((k) => k.startsWith("$"))) {
    for (const [op, expected] of Object.entries(cond)) {
      switch (op) {
        case "$eq":
          if (value !== expected) return false;
          break;
        case "$ne":
          if (value === expected) return false;
          break;
        case "$in":
          if (!Array.isArray(expected) || !expected.includes(value)) return false;
          break;
        case "$nin":
          if (Array.isArray(expected) && expected.includes(value)) return false;
          break;
        case "$gt":
          if (!(value > expected)) return false;
          break;
        case "$gte":
          if (!(value >= expected)) return false;
          break;
        case "$lt":
          if (!(value < expected)) return false;
          break;
        case "$lte":
          if (!(value <= expected)) return false;
          break;
        case "$regex": {
          const flags = typeof cond.$options === "string" ? cond.$options : "";
          const re = expected instanceof RegExp ? expected : new RegExp(expected, flags);
          if (!re.test(String(value ?? ""))) return false;
          break;
        }
        case "$options":
          break;
        case "$exists":
          if (Boolean(value !== undefined && value !== null) !== Boolean(expected)) return false;
          break;
        default:
          throw new Error(`Operador de filtro não suportado: ${op}`);
      }
    }
    return true;
  }
  return value === cond;
}

export function matchFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, cond] of Object.entries(filter)) {
    if (key === "$or") {
      if (!Array.isArray(cond) || !cond.some((f) => matchFilter(doc, f))) return false;
      continue;
    }
    if (key === "$and") {
      if (!Array.isArray(cond) || !cond.every((f) => matchFilter(doc, f))) return false;
      continue;
    }
    if (!matchOp(getPath(doc, key), cond)) return false;
  }
  return true;
}

export function projectDoc(doc, projection) {
  if (!doc || !projection) {
    if (!doc) return doc;
    const { _id, ...rest } = doc;
    return rest;
  }
  const includeId = projection._id !== 0;
  const keys = Object.keys(projection).filter((k) => k !== "_id");
  const isInclusion = keys.some((k) => projection[k] === 1);
  let out;
  if (isInclusion) {
    out = {};
    for (const k of keys) {
      if (projection[k] === 1 && k in doc) out[k] = doc[k];
    }
  } else {
    out = { ...doc };
    for (const k of keys) {
      if (projection[k] === 0) delete out[k];
    }
  }
  if (!includeId) delete out._id;
  else delete out._id;
  return out;
}

export function compareValues(a, b) {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

export function sortDocs(docs, sortSpec) {
  if (!sortSpec || !Object.keys(sortSpec).length) return docs;
  const entries = Object.entries(sortSpec);
  return [...docs].sort((a, b) => {
    for (const [key, dir] of entries) {
      const cmp = compareValues(getPath(a, key), getPath(b, key));
      if (cmp !== 0) return dir < 0 ? -cmp : cmp;
    }
    return 0;
  });
}
