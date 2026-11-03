/** Utilitários de período para dashboard e filtros financeiros */

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function periodPresets() {
  return [
    { id: "hoje", label: "Hoje" },
    { id: "7d", label: "7 dias" },
    { id: "mes", label: "Este mês" },
    { id: "30d", label: "30 dias" },
    { id: "90d", label: "90 dias" },
    { id: "tudo", label: "Tudo" },
    { id: "custom", label: "Personalizado" },
  ];
}

/** Resolve { from, to } a partir do preset ou datas custom. */
export function resolvePeriodRange(preset, customFrom = "", customTo = "") {
  const to = todayStr();
  const now = new Date();
  if (preset === "custom") {
    return { from: (customFrom || "").slice(0, 10), to: (customTo || to).slice(0, 10) };
  }
  if (preset === "tudo") return { from: "", to: "" };
  if (preset === "hoje") return { from: to, to };
  if (preset === "mes") {
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return { from, to };
  }
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const d = new Date(now);
  d.setDate(d.getDate() - (days - 1));
  return { from: d.toISOString().slice(0, 10), to };
}

export function periodLabel(preset, from, to) {
  if (preset === "tudo" || (!from && !to)) return "todo o histórico";
  if (from && to && from === to) return from;
  if (from && to) return `${from} → ${to}`;
  if (from) return `desde ${from}`;
  if (to) return `até ${to}`;
  return "período";
}

/** Params para querystring da API (omite vazios). */
export function toApiParams({ from, to, professional_id, procedure, category }) {
  const p = {};
  if (from) p.from = from;
  if (to) p.to = to;
  if (professional_id && professional_id !== "all") p.professional_id = professional_id;
  if (procedure && procedure !== "all") p.procedure = procedure;
  if (category && category !== "all") p.category = category;
  return p;
}
