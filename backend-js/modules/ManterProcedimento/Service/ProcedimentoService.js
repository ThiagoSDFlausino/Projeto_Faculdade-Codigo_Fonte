import { httpError, id, nowIso } from "../../../src/utils.js";
import { ProcedimentoRepository } from "../Repositories/ProcedimentoRepository.js";
import { Procedimento } from "../Procedimento/Procedimento.js";

function round2(n) {
  return Math.round(n * 100) / 100;
}

export const ProcedimentoService = {
  async listar() {
    const itens = await ProcedimentoRepository.findAll();
    return itens.map((item) => item.toDocument());
  },

  async criar(body = {}) {
    const procedimento = new Procedimento({
      id: id(),
      name: body.name,
      category: body.category || "",
      price: Number(body.price) || 0,
      duration_min: Number(body.duration_min) || 45,
      description: body.description || "",
      active: body.active !== false,
      created_at: nowIso(),
    });
    await ProcedimentoRepository.insert(procedimento);
    return procedimento.toDocument();
  },

  async atualizar(idProcedimento, body = {}) {
    const existing = await ProcedimentoRepository.findById(idProcedimento);
    if (!existing) throw httpError(404, "Procedimento não encontrado");
    const data = {
      name: body.name,
      category: body.category || "",
      price: Number(body.price) || 0,
      duration_min: Number(body.duration_min) || 45,
      description: body.description || "",
      active: body.active !== false,
    };
    const updated = await ProcedimentoRepository.update(idProcedimento, data);
    return updated.toDocument();
  },

  async remover(idProcedimento) {
    const existing = await ProcedimentoRepository.findById(idProcedimento);
    if (!existing) throw httpError(404, "Procedimento não encontrado");
    await ProcedimentoRepository.delete(idProcedimento);
    return { ok: true };
  },

  async estatisticas(query = {}) {
    const from = (query.from || "").slice(0, 10);
    const to = (query.to || "").slice(0, 10);
    const professionalId = String(query.professional_id || "").trim();
    const categoryFilter = String(query.category || "").trim().toLowerCase();
    const inPeriod = (d) => {
      const day = (d || "").slice(0, 10);
      if (!day) return false;
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    };

    const [procedimentos, sessoes, appts] = await Promise.all([
      ProcedimentoRepository.findAll(),
      ProcedimentoRepository.findSessoes(),
      ProcedimentoRepository.findAgendamentosConcluidos(),
    ]);
    const procedures = procedimentos.map((item) => item.toDocument());

    const keyOf = (name, pid) => {
      if (pid) return `id:${pid}`;
      const n = String(name || "").trim().toLowerCase();
      return n ? `name:${n}` : "name:outros";
    };

    const buckets = new Map();
    const ensure = (name, pid, category = "", price = 0) => {
      const key = keyOf(name, pid);
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          id: pid || "",
          name: name || "Outros",
          category: category || "",
          price: price || 0,
          receita_sessoes: 0,
          sessoes: 0,
          agendamentos_concluidos: 0,
        });
      }
      return buckets.get(key);
    };

    for (const p of procedures) {
      if (categoryFilter && String(p.category || "").trim().toLowerCase() !== categoryFilter) continue;
      ensure(p.name, p.id, p.category, p.price);
    }

    const resolveBucket = (procedureName, procedureId) => {
      if (procedureId) {
        const byId = procedures.find((p) => p.id === procedureId);
        if (byId) {
          if (categoryFilter && String(byId.category || "").trim().toLowerCase() !== categoryFilter) return null;
          return ensure(byId.name, byId.id, byId.category, byId.price);
        }
      }
      const n = String(procedureName || "").trim().toLowerCase();
      const byName = procedures.find((p) => String(p.name || "").trim().toLowerCase() === n);
      if (byName) {
        if (categoryFilter && String(byName.category || "").trim().toLowerCase() !== categoryFilter) return null;
        return ensure(byName.name, byName.id, byName.category, byName.price);
      }
      if (categoryFilter) return null;
      return ensure(procedureName || "Outros", "", "", 0);
    };

    for (const s of sessoes) {
      if (professionalId && s.professional_id !== professionalId) continue;
      if (!inPeriod(s.date)) continue;
      const b = resolveBucket(s.procedure, s.procedure_id);
      if (!b) continue;
      b.sessoes += 1;
      b.receita_sessoes += Number(s.value) || 0;
    }

    for (const a of appts) {
      if (professionalId && a.professional_id !== professionalId) continue;
      if (!inPeriod(a.datetime)) continue;
      const b = resolveBucket(a.procedure, a.procedure_id);
      if (!b) continue;
      b.agendamentos_concluidos += 1;
      if ((Number(a.value) || 0) > 0) {
        const day = (a.datetime || "").slice(0, 10);
        const hasSess = sessoes.some((s) =>
          s.cliente_id === a.cliente_id
          && (s.date || "").slice(0, 10) === day
          && String(s.procedure || "").trim().toLowerCase() === String(a.procedure || "").trim().toLowerCase(),
        );
        if (!hasSess) {
          b.receita_sessoes += Number(a.value) || 0;
          b.sessoes += 1;
        }
      }
    }

    const list = [...buckets.values()].map((b) => {
      const faturamento = round2(b.receita_sessoes);
      const atendimentos = b.sessoes;
      return {
        ...b,
        receita_sessoes: faturamento,
        faturamento,
        atendimentos,
        ticket_medio: atendimentos ? round2(faturamento / atendimentos) : 0,
      };
    });

    const withActivityOrCatalog = list.filter((b) =>
      b.id || b.faturamento > 0 || b.atendimentos > 0 || b.agendamentos_concluidos > 0,
    );
    withActivityOrCatalog.sort((a, b) => b.faturamento - a.faturamento || b.atendimentos - a.atendimentos || a.name.localeCompare(b.name));

    const total_faturamento = round2(withActivityOrCatalog.reduce((s, x) => s + x.faturamento, 0));
    const total_atendimentos = withActivityOrCatalog.reduce((s, x) => s + x.atendimentos, 0);

    return {
      periodo: { from: from || null, to: to || null },
      total_faturamento,
      total_atendimentos,
      ticket_medio: total_atendimentos ? round2(total_faturamento / total_atendimentos) : 0,
      procedimentos: withActivityOrCatalog.map((p, i) => ({
        ...p,
        ranking: i + 1,
        pct_faturamento: total_faturamento ? Math.round((p.faturamento / total_faturamento) * 1000) / 10 : 0,
      })),
    };
  },
};
