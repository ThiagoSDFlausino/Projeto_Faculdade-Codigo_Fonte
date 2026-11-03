import { StatusLancamento } from "../Enum/StatusLancamento.js";

export class Lancamento {
  constructor(data = {}) {
    this.id = data.id || "";
    this.type = data.type || "";
    this.description = data.description || "";
    this.category = data.category || "";
    this.amount = Number(data.amount) || 0;
    this.status = data.status || StatusLancamento.PENDENTE;
    this.party = data.party || "";
    this.dueDate = data.due_date || data.dueDate || "";
    this.paidDate = data.paid_date || data.paidDate || "";
    this.createdAt = data.created_at || data.createdAt || null;
  }

  toDocument() {
    return {
      id: this.id,
      type: this.type,
      description: this.description,
      category: this.category,
      amount: this.amount,
      status: this.status,
      party: this.party,
      due_date: this.dueDate,
      paid_date: this.paidDate,
      created_at: this.createdAt,
    };
  }
}
