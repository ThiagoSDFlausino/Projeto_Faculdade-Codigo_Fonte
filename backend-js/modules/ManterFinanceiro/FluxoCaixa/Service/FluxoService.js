import { StatusAgenda } from "../../../ManterAgendamento/Enum/StatusAgenda.js";
import { OrigemFluxo } from "../Enum/OrigemFluxo.js";
import { FluxoRepository } from "../Repositories/FluxoRepository.js";

function inRange(d, fromDate, toDate) {
  if (!d) return false;
  const day = String(d).slice(0, 10);
  if (fromDate && day < fromDate) return false;
  if (toDate && day > toDate) return false;
  return true;
}

function dataAgenda(a) {
  return (a.data_hora_inicio || a.datetime || "").slice(0, 10);
}

function valorAgenda(a) {
  return Number(a.valor_cobrado ?? a.value) || 0;
}

export async function buildFluxo(fromDate, toDate) {
  const [despesas, agendamentos] = await Promise.all([
    FluxoRepository.findDespesas(),
    FluxoRepository.findAgendamentos(),
  ]);

  const entradas = [];
  const a_receber = [];
  const saidas = [];

  for (const a of agendamentos) {
    const data = dataAgenda(a);
    if (!inRange(data, fromDate, toDate)) continue;
    const item = {
      data,
      descricao: `${a.procedure || "Procedimento"} — ${a.cliente_name || ""}`.trim(),
      categoria: a.procedure || "",
      valor: valorAgenda(a),
      origem: OrigemFluxo.AGENDA,
      status_agenda: a.status,
      agendamento_id: a.id,
      profissional: a.professional || "",
    };
    if (a.status === StatusAgenda.CONCLUIDO) entradas.push(item);
    else if (a.status === StatusAgenda.CONFIRMADO) a_receber.push(item);
  }

  for (const t of despesas) {
    if (t.type === "receita") continue;
    const d = t.data || t.due_date || t.paid_date || "";
    if (!inRange(d, fromDate, toDate)) continue;
    saidas.push({
      data: String(d).slice(0, 10),
      descricao: t.description || "",
      categoria: t.category || "",
      valor: Number(t.amount) || 0,
      origem: OrigemFluxo.DESPESA,
      usuario_nome: t.usuario_nome || "",
    });
  }

  const total_entradas = entradas.reduce((s, i) => s + i.valor, 0);
  const total_saidas = saidas.reduce((s, i) => s + i.valor, 0);
  const total_a_receber = a_receber.reduce((s, i) => s + i.valor, 0);

  return {
    entradas: entradas.sort((a, b) => b.data.localeCompare(a.data)),
    a_receber: a_receber.sort((a, b) => b.data.localeCompare(a.data)),
    saidas: saidas.sort((a, b) => b.data.localeCompare(a.data)),
    total_entradas,
    total_saidas,
    total_a_receber,
    saldo: total_entradas - total_saidas,
  };
}

export const FluxoService = {
  obter(fromDate, toDate) {
    return buildFluxo(fromDate, toDate);
  },
};
