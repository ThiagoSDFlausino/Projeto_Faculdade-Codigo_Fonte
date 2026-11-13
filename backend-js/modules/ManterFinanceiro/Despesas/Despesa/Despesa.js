export class Despesa {
  constructor(data = {}) {
    this.id = data.id || "";
    this.type = "despesa";
    this.description = data.description || data.descricao || "";
    this.category = data.category || "";
    this.amount = Number(data.amount ?? data.valor) || 0;
    this.party = data.party || "";
    this.dueDate = data.due_date || data.dueDate || data.data || "";
    this.usuarioId = data.usuario_id || data.usuarioId || "";
    this.usuarioNome = data.usuario_nome || data.usuarioNome || "";
    this.createdAt = data.created_at || data.createdAt || null;
  }

  toDocument() {
    return {
      id: this.id,
      type: "despesa",
      description: this.description,
      descricao: this.description,
      category: this.category,
      amount: this.amount,
      valor: this.amount,
      party: this.party,
      due_date: this.dueDate,
      data: this.dueDate || "",
      usuario_id: this.usuarioId,
      usuario_nome: this.usuarioNome,
      created_at: this.createdAt,
    };
  }
}
