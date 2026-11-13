import { recalcClienteLtv, syncClienteDenormalized } from "../../../src/clientMetrics.js";
import { httpError, id, nowIso, omitMany } from "../../../src/utils.js";
import { PerfilUsuario } from "../../ManterUsuario/Enum/PerfilUsuario.js";
import { UsuarioRepository } from "../../ManterUsuario/Repositories/UsuarioRepository.js";
import { Cliente } from "../Cliente/Cliente.js";
import { StatusCliente } from "../Enum/StatusCliente.js";
import { ClienteRepository } from "../Repositories/ClienteRepository.js";

async function resolveProfessionalName(professionalId) {
  if (!professionalId) return "";
  const prof = await UsuarioRepository.findById(professionalId);
  return prof?.name || "";
}

export const ClienteService = {
  async listar() {
    const clientes = await ClienteRepository.findAll();
    return clientes.map((c) => c.toDocument());
  },

  async detalhar(clienteId, user) {
    let doc = (await ClienteRepository.findById(clienteId))?.toDocument();
    if (!doc) throw httpError(404, "Cliente não encontrado");

    const sessQ = { cliente_id: clienteId };
    const apptQ = { cliente_id: clienteId };
    if (user.role === PerfilUsuario.PROFISSIONAL) {
      apptQ.professional_id = user.id;
    }

    const [
      anamneses, sessoesRaw, appointmentsRaw, gallery,
      notas, lembretes, avaliacoesRaw, interacoes,
    ] = await ClienteRepository.findRelated(clienteId, { sessQ, apptQ });

    let sessoes = omitMany(sessoesRaw);
    let appointments = omitMany(appointmentsRaw);
    let avaliacoes = omitMany(avaliacoesRaw);

    if (user.role === PerfilUsuario.PROFISSIONAL) {
      avaliacoes = [];
      sessoes = sessoes.map((s) => {
        if (s.professional_id === user.id) return s;
        const { value, ...rest } = s;
        return { ...rest, value: null, value_hidden: true };
      });
      const meuGasto = Math.round(
        sessoes
          .filter((s) => s.professional_id === user.id)
          .reduce((acc, s) => acc + (Number(s.value) || 0), 0) * 100,
      ) / 100;
      doc = { ...doc, total_spent: meuGasto, total_spent_own_only: true };
    }

    return {
      cliente: doc,
      anamneses: omitMany(anamneses),
      sessoes,
      appointments,
      gallery: omitMany(gallery),
      notas: omitMany(notas),
      lembretes: omitMany(lembretes),
      avaliacoes,
      interacoes: omitMany(interacoes),
    };
  },

  async criar(body = {}) {
    if (!body.name) throw httpError(400, "Nome obrigatório");
    const cliente = new Cliente({
      id: id(),
      name: body.name,
      phone: body.phone || "",
      email: body.email || "",
      birthdate: body.birthdate || "",
      photo: body.photo || "",
      tags: body.tags || [],
      status: body.status || StatusCliente.ATIVO,
      notes: body.notes || "",
      total_spent: 0,
      created_at: nowIso(),
    });
    await ClienteRepository.insert(cliente);
    return cliente.toDocument();
  },

  async atualizar(clienteId, body = {}) {
    const existing = await ClienteRepository.findById(clienteId);
    if (!existing) throw httpError(404, "Cliente não encontrado");
    if (!body.name || !String(body.name).trim()) throw httpError(400, "Nome obrigatório");
    const data = {
      name: String(body.name).trim(),
      phone: body.phone || "",
      email: body.email || "",
      birthdate: body.birthdate || "",
      photo: body.photo || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      status: body.status || StatusCliente.ATIVO,
      notes: body.notes || "",
    };
    await ClienteRepository.update(clienteId, data);
    if (data.name !== existing.name) {
      await syncClienteDenormalized(clienteId, { name: data.name });
    }
    await recalcClienteLtv(clienteId);
    return (await ClienteRepository.findById(clienteId)).toDocument();
  },

  async remover(clienteId) {
    const existing = await ClienteRepository.findById(clienteId);
    if (!existing) throw httpError(404, "Cliente não encontrado");
    await ClienteRepository.delete(clienteId);
    return { ok: true };
  },

  async criarAnamnese(body = {}) {
    if (!(await ClienteRepository.findById(body.cliente_id))) throw httpError(404, "Cliente não encontrado");
    const obj = {
      id: id(),
      cliente_id: body.cliente_id,
      skin_type: body.skin_type || "",
      allergies: body.allergies || "",
      health_conditions: body.health_conditions || "",
      medications: body.medications || "",
      area: body.area || "",
      observations: body.observations || "",
      attachment: typeof body.attachment === "string" ? body.attachment : "",
      attachment_name: body.attachment_name || "",
      attachment_type: body.attachment_type || "",
      created_at: nowIso(),
    };
    if (obj.attachment && obj.attachment.length > 7 * 1024 * 1024) {
      throw httpError(400, "Anexo muito grande (máx. ~5MB)");
    }
    await ClienteRepository.insertAnamnese(obj);
    return obj;
  },

  async atualizarAnamnese(anamId, body = {}) {
    const existing = await ClienteRepository.findAnamnese(anamId);
    if (!existing) throw httpError(404, "Anamnese não encontrada");
    const data = {
      skin_type: body.skin_type || "",
      allergies: body.allergies || "",
      health_conditions: body.health_conditions || "",
      medications: body.medications || "",
      area: body.area || "",
      observations: body.observations || "",
      attachment: typeof body.attachment === "string" ? body.attachment : (existing.attachment || ""),
      attachment_name: body.attachment_name != null ? body.attachment_name : (existing.attachment_name || ""),
      attachment_type: body.attachment_type != null ? body.attachment_type : (existing.attachment_type || ""),
    };
    if (data.attachment && data.attachment.length > 7 * 1024 * 1024) {
      throw httpError(400, "Anexo muito grande (máx. ~5MB)");
    }
    await ClienteRepository.updateAnamnese(anamId, data);
    return { ...existing, ...data };
  },

  async removerAnamnese(anamId) {
    const existing = await ClienteRepository.findAnamnese(anamId);
    if (!existing) throw httpError(404, "Anamnese não encontrada");
    await ClienteRepository.deleteAnamnese(anamId);
    return { ok: true };
  },

  async criarSessao(user, body = {}) {
    if (!(await ClienteRepository.findById(body.cliente_id))) throw httpError(404, "Cliente não encontrado");
    const data = { ...body };
    if (user.role === PerfilUsuario.PROFISSIONAL) {
      data.professional_id = user.id;
      data.professional = user.name;
    } else if (data.professional_id) {
      data.professional = await resolveProfessionalName(data.professional_id);
    }
    let value = Number(data.value);
    if (Number.isNaN(value) || data.value === "" || data.value == null) value = 0;
    const obj = {
      id: id(),
      cliente_id: data.cliente_id,
      procedure_id: data.procedure_id || "",
      procedure: data.procedure,
      professional_id: data.professional_id || "",
      professional: data.professional || "",
      date: data.date || "",
      value,
      notes: data.notes || "",
      created_at: nowIso(),
    };
    await ClienteRepository.insertSessao(obj);
    await recalcClienteLtv(obj.cliente_id);
    return obj;
  },

  async atualizarSessao(user, sessaoId, body = {}) {
    const existing = await ClienteRepository.findSessao(sessaoId);
    if (!existing) throw httpError(404, "Sessão não encontrada");
    if (user.role === PerfilUsuario.PROFISSIONAL && existing.professional_id && existing.professional_id !== user.id) {
      throw httpError(403, "Você só pode editar tratamentos seus");
    }
    const data = { ...body };
    if (user.role === PerfilUsuario.PROFISSIONAL) {
      data.professional_id = user.id;
      data.professional = user.name;
    } else if (data.professional_id) {
      data.professional = await resolveProfessionalName(data.professional_id);
    }
    const upd = {
      procedure_id: data.procedure_id || "",
      procedure: data.procedure || existing.procedure,
      professional_id: data.professional_id || "",
      professional: data.professional || "",
      date: data.date || "",
      value: Number(data.value) || 0,
      notes: data.notes || "",
    };
    await ClienteRepository.updateSessao(sessaoId, upd);
    await recalcClienteLtv(existing.cliente_id);
    return { ...existing, ...upd };
  },

  async removerSessao(user, sessaoId) {
    const existing = await ClienteRepository.findSessao(sessaoId);
    if (!existing) throw httpError(404, "Sessão não encontrada");
    if (user.role === PerfilUsuario.PROFISSIONAL && existing.professional_id && existing.professional_id !== user.id) {
      throw httpError(403, "Você só pode remover tratamentos seus");
    }
    await ClienteRepository.deleteSessao(sessaoId);
    await recalcClienteLtv(existing.cliente_id);
    return { ok: true };
  },

  async criarGallery(body = {}) {
    const obj = {
      id: id(),
      cliente_id: body.cliente_id,
      title: body.title || "",
      procedure: body.procedure || "",
      before_image: body.before_image || "",
      after_image: body.after_image || "",
      notes: body.notes || "",
      date: body.date || "",
      created_at: nowIso(),
    };
    await ClienteRepository.insertGallery(obj);
    return obj;
  },

  async atualizarGallery(gid, body = {}) {
    const existing = await ClienteRepository.findGallery(gid);
    if (!existing) throw httpError(404, "Registro não encontrado");
    const data = {
      title: body.title || "",
      procedure: body.procedure || "",
      before_image: body.before_image || existing.before_image || "",
      after_image: body.after_image || existing.after_image || "",
      notes: body.notes || "",
      date: body.date || "",
    };
    await ClienteRepository.updateGallery(gid, data);
    return { ...existing, ...data };
  },

  async removerGallery(gid) {
    const existing = await ClienteRepository.findGallery(gid);
    if (!existing) throw httpError(404, "Registro não encontrado");
    await ClienteRepository.deleteGallery(gid);
    return { ok: true };
  },

  async criarNota(user, clienteId, body = {}) {
    if (!(await ClienteRepository.findById(clienteId))) throw httpError(404, "Cliente não encontrado");
    const obj = {
      id: id(),
      cliente_id: clienteId,
      titulo: body.titulo || "",
      conteudo: body.conteudo || "",
      is_pinned: !!body.is_pinned,
      criado_por_id: user.id,
      criado_por_nome: user.name,
      created_at: nowIso(),
    };
    await ClienteRepository.insertNota(obj);
    return obj;
  },

  async atualizarNota(notaId, body = {}) {
    const existing = await ClienteRepository.findNota(notaId);
    if (!existing) throw httpError(404, "Nota não encontrada");
    const data = {
      titulo: body.titulo || "",
      conteudo: body.conteudo || "",
      is_pinned: !!body.is_pinned,
    };
    await ClienteRepository.updateNota(notaId, data);
    return { ...existing, ...data };
  },

  async removerNota(notaId) {
    const existing = await ClienteRepository.findNota(notaId);
    if (!existing) throw httpError(404, "Nota não encontrada");
    await ClienteRepository.deleteNota(notaId);
    return { ok: true };
  },

  async criarLembrete(clienteId, body = {}) {
    if (!(await ClienteRepository.findById(clienteId))) throw httpError(404, "Cliente não encontrado");
    const obj = {
      id: id(),
      cliente_id: clienteId,
      titulo: body.titulo,
      descricao: body.descricao || "",
      data_vencimento: body.data_vencimento || "",
      prioridade: body.prioridade || "media",
      status: body.status || "pendente",
      responsavel_id: body.responsavel_id || "",
      created_at: nowIso(),
    };
    await ClienteRepository.insertLembrete(obj);
    return obj;
  },

  async atualizarLembrete(lembreteId, body = {}) {
    const existing = await ClienteRepository.findLembrete(lembreteId);
    if (!existing) throw httpError(404, "Lembrete não encontrado");
    const data = {
      titulo: body.titulo || existing.titulo,
      descricao: body.descricao || "",
      data_vencimento: body.data_vencimento || "",
      prioridade: body.prioridade || "media",
      status: body.status || existing.status || "pendente",
      responsavel_id: body.responsavel_id || "",
    };
    await ClienteRepository.updateLembrete(lembreteId, data);
    return { ...existing, ...data };
  },

  async atualizarStatusLembrete(lembreteId, status) {
    const existing = await ClienteRepository.findLembrete(lembreteId);
    if (!existing) throw httpError(404, "Lembrete não encontrado");
    const data = { status };
    await ClienteRepository.updateLembrete(lembreteId, data);
    return { ...existing, ...data };
  },

  async removerLembrete(lembreteId) {
    const existing = await ClienteRepository.findLembrete(lembreteId);
    if (!existing) throw httpError(404, "Lembrete não encontrado");
    await ClienteRepository.deleteLembrete(lembreteId);
    return { ok: true };
  },

  async criarAvaliacao(user, clienteId, body = {}) {
    if (!(await ClienteRepository.findById(clienteId))) throw httpError(404, "Cliente não encontrado");
    const obj = {
      id: id(),
      cliente_id: clienteId,
      nota: Math.max(1, Math.min(10, Number(body.nota) || 5)),
      comentario: body.comentario || "",
      tipo: body.tipo || "geral",
      registrado_por_id: user.id,
      created_at: nowIso(),
    };
    await ClienteRepository.insertAvaliacao(obj);
    return obj;
  },

  async atualizarAvaliacao(avId, body = {}) {
    const existing = await ClienteRepository.findAvaliacao(avId);
    if (!existing) throw httpError(404, "Avaliação não encontrada");
    const data = {
      nota: Math.max(1, Math.min(10, Number(body.nota) || 5)),
      comentario: body.comentario || "",
      tipo: body.tipo || "geral",
    };
    await ClienteRepository.updateAvaliacao(avId, data);
    return { ...existing, ...data };
  },

  async removerAvaliacao(avId) {
    const existing = await ClienteRepository.findAvaliacao(avId);
    if (!existing) throw httpError(404, "Avaliação não encontrada");
    await ClienteRepository.deleteAvaliacao(avId);
    return { ok: true };
  },

  async criarInteracao(user, clienteId, body = {}) {
    if (!(await ClienteRepository.findById(clienteId))) throw httpError(404, "Cliente não encontrado");
    const obj = {
      id: id(),
      cliente_id: clienteId,
      tipo: body.tipo || "ligacao",
      canal: body.canal || "telefone",
      descricao: body.descricao || "",
      resultado: body.resultado || "",
      registrado_por_id: user.id,
      registrado_por_nome: user.name,
      created_at: nowIso(),
    };
    await ClienteRepository.insertInteracao(obj);
    return obj;
  },

  async atualizarInteracao(intId, body = {}) {
    const existing = await ClienteRepository.findInteracao(intId);
    if (!existing) throw httpError(404, "Interação não encontrada");
    const data = {
      tipo: body.tipo || "ligacao",
      canal: body.canal || "telefone",
      descricao: body.descricao || "",
      resultado: body.resultado || "",
    };
    await ClienteRepository.updateInteracao(intId, data);
    return { ...existing, ...data };
  },

  async removerInteracao(intId) {
    const existing = await ClienteRepository.findInteracao(intId);
    if (!existing) throw httpError(404, "Interação não encontrada");
    await ClienteRepository.deleteInteracao(intId);
    return { ok: true };
  },
};
