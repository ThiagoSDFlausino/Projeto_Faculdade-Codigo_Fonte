import { httpError, id, nowIso } from "../../../../src/utils.js";
import { Despesa } from "../Despesa/Despesa.js";
import { DespesaRepository } from "../Repositories/DespesaRepository.js";

export const DespesaService = {
  async listar() {
    const todos = await DespesaRepository.findAll();
    return todos
      .filter((d) => d.type === "despesa" || !d.type)
      .map((d) => d.toDocument());
  },

  async criar(body = {}, usuario = null) {
    const despesa = new Despesa({
      id: id(),
      description: body.description || body.descricao,
      category: body.category || "",
      amount: Number(body.amount ?? body.valor) || 0,
      party: body.party || "",
      due_date: body.due_date || body.data || "",
      usuario_id: body.usuario_id || usuario?.id || "",
      usuario_nome: body.usuario_nome || usuario?.name || "",
      created_at: nowIso(),
    });
    await DespesaRepository.insert(despesa);
    return despesa.toDocument();
  },

  async atualizar(txId, body = {}) {
    const existing = await DespesaRepository.findById(txId);
    if (!existing) throw httpError(404, "Despesa não encontrada");
    const data = {
      type: "despesa",
      description: body.description || body.descricao || existing.description,
      category: body.category || "",
      amount: Number(body.amount ?? body.valor) || 0,
      party: body.party || "",
      due_date: body.due_date || body.data || "",
      usuario_id: body.usuario_id !== undefined ? body.usuario_id : existing.usuarioId,
      usuario_nome: body.usuario_nome !== undefined ? body.usuario_nome : existing.usuarioNome,
    };
    return (await DespesaRepository.update(txId, data)).toDocument();
  },

  async remover(txId) {
    const existing = await DespesaRepository.findById(txId);
    if (!existing) throw httpError(404, "Despesa não encontrada");
    await DespesaRepository.delete(txId);
    return { ok: true };
  },
};
