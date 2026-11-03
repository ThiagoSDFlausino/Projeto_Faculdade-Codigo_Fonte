import { httpError, id, nowIso } from "../../../../src/utils.js";
import { buildFluxo } from "../../FluxoCaixa/Service/FluxoService.js";
import { Fechamento } from "../Fechamento/Fechamento.js";
import { FechamentoRepository } from "../Repositories/FechamentoRepository.js";

function inPeriodDay(d, fromDate, toDate) {
  if (!d) return false;
  const day = String(d).slice(0, 10);
  if (fromDate && day < fromDate) return false;
  if (toDate && day > toDate) return false;
  return true;
}

export async function buildFechamentoPreview(periodo_inicio, periodo_fim) {
  const fluxo = await buildFluxo(periodo_inicio, periodo_fim);
  const profs = await FechamentoRepository.findProfissionais();
  const profMap = Object.fromEntries(profs.map((p) => [p.id, p]));
  const clientes = await FechamentoRepository.findClientesBasico();
  const clienteMap = Object.fromEntries(clientes.map((c) => [c.id, c.name]));

  const sessoes = (await FechamentoRepository.findSessoes())
    .filter((s) => inPeriodDay(s.date, periodo_inicio, periodo_fim) && !s.fechamento_id);

  const byProf = {};
  const atendimentos = [];

  for (const s of sessoes) {
    const prof = profMap[s.professional_id];
    const valor = Number(s.value) || 0;
    const pid = s.professional_id || "sem";
    if (!byProf[pid]) {
      byProf[pid] = {
        professional_id: s.professional_id || "",
        profissional_nome: prof?.name || s.professional || "Sem profissional",
        specialty: prof?.specialty || "",
        total_atendimentos: 0,
        total_faturamento: 0,
      };
    }
    byProf[pid].total_atendimentos += 1;
    byProf[pid].total_faturamento += valor;
    atendimentos.push({
      id: s.id,
      date: (s.date || "").slice(0, 10),
      procedure: s.procedure || "",
      cliente_nome: clienteMap[s.cliente_id] || "—",
      profissional_nome: prof?.name || s.professional || "—",
      valor,
    });
  }

  const por_profissional = Object.values(byProf)
    .map((p) => ({
      ...p,
      total_faturamento: Math.round(p.total_faturamento * 100) / 100,
    }))
    .sort((a, b) => b.total_faturamento - a.total_faturamento);

  atendimentos.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const total_faturamento = Math.round(fluxo.total_entradas * 100) / 100;
  const total_despesas = Math.round(fluxo.total_saidas * 100) / 100;
  const lucro_liquido = Math.round((total_faturamento - total_despesas) * 100) / 100;

  const ja = await FechamentoRepository.findByPeriodo(periodo_inicio, periodo_fim);

  return {
    periodo_inicio,
    periodo_fim,
    total_faturamento,
    total_despesas,
    total_insumos: total_despesas,
    lucro_liquido,
    total_atendimentos: sessoes.length,
    por_profissional,
    atendimentos,
    entradas_resumo: fluxo.entradas.slice(0, 20),
    saidas_resumo: fluxo.saidas.slice(0, 20),
    ja_fechado: Boolean(ja),
    fechamento_id: ja?.id || null,
  };
}

export const FechamentoService = {
  async listar() {
    return (await FechamentoRepository.findAll()).map((f) => f.toDocument());
  },
  async obter(fid) {
    const doc = await FechamentoRepository.findById(fid);
    if (!doc) throw httpError(404, "Fechamento não encontrado");
    return doc.toDocument();
  },
  preview(periodo_inicio, periodo_fim) {
    if (!periodo_inicio || !periodo_fim) throw httpError(400, "Informe o período");
    return buildFechamentoPreview(String(periodo_inicio).slice(0, 10), String(periodo_fim).slice(0, 10));
  },
  async criar(user, body = {}) {
    const periodo_inicio = String(body.periodo_inicio || "").slice(0, 10);
    const periodo_fim = String(body.periodo_fim || "").slice(0, 10);
    if (!periodo_inicio || !periodo_fim) throw httpError(400, "Informe o período");

    const existing = await FechamentoRepository.findByPeriodo(periodo_inicio, periodo_fim);
    if (existing) throw httpError(400, "Fechamento já existe para este período");

    const preview = await buildFechamentoPreview(periodo_inicio, periodo_fim);
    if (preview.total_atendimentos === 0 && preview.total_faturamento === 0 && preview.total_despesas === 0) {
      throw httpError(400, "Não há movimentos neste período para fechar");
    }

    const sessaoIds = (preview.atendimentos || []).map((a) => a.id).filter(Boolean);
    const fechamento = new Fechamento({
      id: id(),
      periodo_inicio,
      periodo_fim,
      total_faturamento: preview.total_faturamento,
      total_despesas: preview.total_despesas,
      total_insumos: preview.total_despesas,
      lucro_liquido: preview.lucro_liquido,
      total_atendimentos: preview.total_atendimentos,
      por_profissional: preview.por_profissional,
      sessao_ids: sessaoIds,
      gerado_por_id: user.id,
      gerado_por_nome: user.name || "",
      created_at: nowIso(),
    });
    await FechamentoRepository.insert(fechamento);
    await FechamentoRepository.markSessoes(sessaoIds, fechamento.id);
    return fechamento.toDocument();
  },
  async remover(fid) {
    const doc = await FechamentoRepository.findById(fid);
    if (!doc) throw httpError(404, "Fechamento não encontrado");
    await FechamentoRepository.delete(doc.id);
    return { ok: true };
  },
};
