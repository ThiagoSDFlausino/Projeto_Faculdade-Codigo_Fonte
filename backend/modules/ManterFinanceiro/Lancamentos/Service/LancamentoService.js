import { httpError, id, nowIso, todayStr } from "../../../../src/utils.js";
import { StatusLancamento } from "../Enum/StatusLancamento.js";
import { Lancamento } from "../Lancamento/Lancamento.js";
import { LancamentoRepository } from "../Repositories/LancamentoRepository.js";

export const LancamentoService = {
  async listar() {
    return (await LancamentoRepository.findAll()).map((l) => l.toDocument());
  },
  async criar(body = {}) {
    const lancamento = new Lancamento({
      id: id(),
      type: body.type,
      description: body.description,
      category: body.category || "",
      amount: Number(body.amount) || 0,
      status: body.status || StatusLancamento.PENDENTE,
      party: body.party || "",
      due_date: body.due_date || "",
      paid_date: body.paid_date || "",
      created_at: nowIso(),
    });
    await LancamentoRepository.insert(lancamento);
    return lancamento.toDocument();
  },
  async atualizar(txId, body = {}) {
    const existing = await LancamentoRepository.findById(txId);
    if (!existing) throw httpError(404, "Lançamento não encontrado");
    const data = {
      type: body.type,
      description: body.description,
      category: body.category || "",
      amount: Number(body.amount) || 0,
      status: body.status || StatusLancamento.PENDENTE,
      party: body.party || "",
      due_date: body.due_date || "",
      paid_date: body.paid_date || "",
    };
    return (await LancamentoRepository.update(txId, data)).toDocument();
  },
  async pagar(txId) {
    const existing = await LancamentoRepository.findById(txId);
    if (!existing) throw httpError(404, "Lançamento não encontrado");
    const data = { status: StatusLancamento.PAGO, paid_date: todayStr() };
    return (await LancamentoRepository.update(txId, data)).toDocument();
  },
  async remover(txId) {
    const existing = await LancamentoRepository.findById(txId);
    if (!existing) throw httpError(404, "Lançamento não encontrado");
    await LancamentoRepository.delete(txId);
    return { ok: true };
  },
};
