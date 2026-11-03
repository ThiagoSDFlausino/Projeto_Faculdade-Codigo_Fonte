import { httpError, id, nowIso } from "../../../src/utils.js";
import { PerfilUsuario } from "../../ManterUsuario/Enum/PerfilUsuario.js";
import { UsuarioRepository } from "../../ManterUsuario/Repositories/UsuarioRepository.js";
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
  const day = (item.datetime || "").slice(0, 10);
  if (query.from_date && day < query.from_date) return false;
  if (query.to_date && day > query.to_date) return false;
  return true;
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

function campos(data) {
  return {
    cliente_id: data.cliente_id || "",
    cliente_name: data.cliente_name || "",
    professional_id: data.professional_id || "",
    professional: data.professional || "",
    procedure_id: data.procedure_id || "",
    procedure: data.procedure || "",
    datetime: data.datetime || "",
    room: data.room || "",
    status: data.status || StatusAgenda.AGENDADO,
    value: Number(data.value) || 0,
  };
}

export const AgendaService = {
  async listar(usuario, query = {}) {
    const itens = await AgendaRepository.find(filtroListagem(usuario, query));
    return itens.filter((item) => noPeriodo(item, query)).map((item) => item.toDocument());
  },

  async criar(usuario, body = {}) {
    const data = await aplicarProfissional(usuario, { ...body });
    const agendamento = new Agendamento({
      id: id(),
      ...campos(data),
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
    const set = campos(data);
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
