import { StatusLancamento, TipoLancamento } from "../../Lancamentos/Enum/StatusLancamento.js";
import { FluxoRepository } from "../Repositories/FluxoRepository.js";

export async function buildFluxo(fromDate, toDate) {
  const txs = await FluxoRepository.findTransactions();
  const sessoes = await FluxoRepository.findSessoes();
  const inRange = (d) => {
    if (!d) return false;
    const day = d.slice(0, 10);
    if (fromDate && day < fromDate) return false;
    if (toDate && day > toDate) return false;
    return true;
  };
  const entradas = [];
  const saidas = [];
  for (const t of txs) {
    const d = t.paid_date || t.due_date || "";
    if (t.status !== StatusLancamento.PAGO || !inRange(d)) continue;
    const item = {
      data: d.slice(0, 10),
      descricao: t.description || "",
      categoria: t.category || "",
      valor: t.amount || 0,
      origem: "lancamento",
    };
    if (t.type === TipoLancamento.RECEITA) entradas.push(item);
    else saidas.push(item);
  }
  for (const s of sessoes) {
    if (!inRange(s.date || "")) continue;
    entradas.push({
      data: (s.date || "").slice(0, 10),
      descricao: `Sessão ${s.procedure || ""}`,
      categoria: s.procedure || "",
      valor: s.value || 0,
      origem: "sessao",
    });
  }
  const total_entradas = entradas.reduce((s, i) => s + i.valor, 0);
  const total_saidas = saidas.reduce((s, i) => s + i.valor, 0);
  return {
    entradas: entradas.sort((a, b) => b.data.localeCompare(a.data)),
    saidas: saidas.sort((a, b) => b.data.localeCompare(a.data)),
    total_entradas,
    total_saidas,
    saldo: total_entradas - total_saidas,
  };
}

export const FluxoService = {
  obter(fromDate, toDate) {
    return buildFluxo(fromDate, toDate);
  },
};
