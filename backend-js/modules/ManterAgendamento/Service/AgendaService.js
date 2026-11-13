import { httpError, id, nowIso } from "../../../src/utils.js";
import { PerfilUsuario } from "../../ManterUsuario/Enum/PerfilUsuario.js";
import { UsuarioRepository } from "../../ManterUsuario/Repositories/UsuarioRepository.js";
import { ProcedimentoRepository } from "../../ManterProcedimento/Repositories/ProcedimentoRepository.js";
import { StatusAgenda } from "../Enum/StatusAgenda.js";
import { AgendaRepository } from "../Repositories/AgendaRepository.js";
import { Agendamento } from "../Agendamento/Agendamento.js";

async function nomeProfissional(professionalId) {
  if (!professionalId) return "";
  const prof = await UsuarioRepository.findById(professionalId);
  return prof?.name || "";
}

function filtroListagem(usuario, query = {}) {
  const filter = {};
  if (usuario.role === PerfilUsuario.PROFISSIONAL) filter.professional_id = usuario.id;
  else if (query.professional_id) filter.professional_id = query.professional_id;
  if (query.status) filter.status = query.status;
  return filter;
}

function noPeriodo(item, query = {}) {
  const day = (item.data_hora_inicio || item.datetime || "").slice(0, 10);
  if (query.from_date && day < query.from_date) return false;
  if (query.to_date && day > query.to_date) return false;
  return true;
}

function addMinutesLocal(isoLocal, minutes) {
  if (!isoLocal) return "";
  const m = String(isoLocal).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  d.setMinutes(d.getMinutes() + (Number(minutes) || 0));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function aplicarProfissional(usuario, data, atual) {
  if (usuario.role === PerfilUsuario.PROFISSIONAL) {
    data.professional_id = usuario.id;
    data.professional = usuario.name;
    return data;
  }
  if (data.professional_id) {
    data.professional = (await nomeProfissional(data.professional_id)) || atual?.professional || "";
  }
  return data;
}

async function validarProcedimentoDoProfissional(professionalId, procedureId) {
  if (!professionalId || !procedureId) return;
  const prof = await UsuarioRepository.findById(professionalId);
  const allowed = prof?.procedimentoIds || [];
  if (allowed.length > 0 && !allowed.includes(procedureId)) {
    throw httpError(400, "Este profissional não está habilitado para o procedimento selecionado");
  }
}

async function resolverHorarios(data) {
  const inicio = data.data_hora_inicio || data.datetime || "";
  let fim = data.data_hora_fim || "";
  if (inicio && !fim && data.procedure_id) {
    const proc = await ProcedimentoRepository.findById(data.procedure_id);
    const duracao = proc?.duration_min || 60;
    fim = addMinutesLocal(inicio, duracao);
  }
  return { inicio, fim };
}

async function campos(data) {
  const { inicio, fim } = await resolverHorarios(data);
  const valor = Number(data.valor_cobrado ?? data.value) || 0;
  return {
    cliente_id: data.cliente_id || "",
    cliente_name: data.cliente_name || "",
    professional_id: data.professional_id || "",
    professional: data.professional || "",
    procedure_id: data.procedure_id || "",
    procedure: data.procedure || "",
    data_hora_inicio: inicio,
    data_hora_fim: fim,
    datetime: inicio,
    valor_cobrado: valor,
    value: valor,
    observacoes: data.observacoes || "",
    room: data.room || "",
    status: data.status || StatusAgenda.AGENDADO,
  };
}

export const AgendaService = {
  async listar(usuario, query = {}) {
    const itens = await AgendaRepository.find(filtroListagem(usuario, query));
    return itens.filter((item) => noPeriodo(item, query)).map((item) => item.toDocument());
  },

  async criar(usuario, body = {}) {
    const data = await aplicarProfissional(usuario, { ...body });
    await validarProcedimentoDoProfissional(data.professional_id, data.procedure_id);
    const agendamento = new Agendamento({
      id: id(),
      ...(await campos(data)),
      created_at: nowIso(),
    });
    await AgendaRepository.insert(agendamento);
    return agendamento.toDocument();
  },

  async atualizar(usuario, idAgendamento, body = {}) {
    const existing = await AgendaRepository.findById(idAgendamento);
    if (!existing) throw httpError(404, "Agendamento não encontrado");
    if (usuario.role === PerfilUsuario.PROFISSIONAL && existing.professional_id !== usuario.id) {
      throw httpError(404, "Agendamento não encontrado");
    }
    const data = await aplicarProfissional(usuario, { ...body }, existing);
    const professionalId = data.professional_id || existing.professional_id;
    const procedureId = data.procedure_id || existing.procedure_id;
    await validarProcedimentoDoProfissional(professionalId, procedureId);
    const set = await campos({
      ...existing.toDocument(),
      ...data,
      data_hora_inicio: data.data_hora_inicio || data.datetime || existing.data_hora_inicio || existing.datetime,
      data_hora_fim: data.data_hora_fim !== undefined ? data.data_hora_fim : existing.data_hora_fim,
      observacoes: data.observacoes !== undefined ? data.observacoes : existing.observacoes,
    });
    const updated = await AgendaRepository.update(idAgendamento, set);
    return updated.toDocument();
  },

  async remover(usuario, idAgendamento) {
    const existing = await AgendaRepository.findById(idAgendamento);
    if (!existing) throw httpError(404, "Agendamento não encontrado");
    if (usuario.role === PerfilUsuario.PROFISSIONAL && existing.professional_id !== usuario.id) {
      throw httpError(404, "Agendamento não encontrado");
    }
    await AgendaRepository.delete(idAgendamento);
    return { ok: true };
  },
};
