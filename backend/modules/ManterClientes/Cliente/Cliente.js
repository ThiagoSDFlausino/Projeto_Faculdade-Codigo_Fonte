import { StatusCliente } from "../Enum/StatusCliente.js";

export class Cliente {
  constructor(data = {}) {
    this.id = data.id || "";
    this.name = data.name || "";
    this.phone = data.phone || "";
    this.email = data.email || "";
    this.birthdate = data.birthdate || "";
    this.photo = data.photo || "";
    this.tags = Array.isArray(data.tags) ? data.tags : [];
    this.status = data.status || StatusCliente.ATIVO;
    this.notes = data.notes || "";
    this.totalSpent = data.total_spent ?? data.totalSpent ?? 0;
    this.createdAt = data.created_at || data.createdAt || null;
  }

  toDocument() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      email: this.email,
      birthdate: this.birthdate,
      photo: this.photo,
      tags: this.tags,
      status: this.status,
      notes: this.notes,
      total_spent: this.totalSpent,
      created_at: this.createdAt,
    };
  }
}
