import { PerfilUsuario } from "../Enum/PerfilUsuario.js";

export class Usuario {
  constructor(data = {}) {
    this.id = data.id || "";
    this.email = data.email || "";
    this.name = data.name || "";
    this.role = data.role || PerfilUsuario.PROFISSIONAL;
    this.funcao = data.funcao || data.specialty || "";
    this.specialty = this.funcao;
    this.commissionPct = data.commission_pct ?? data.commissionPct ?? 0;
    this.photo = data.photo || "";
    this.active = data.active !== false;
    this.passwordHash = data.password_hash || data.passwordHash || "";
    this.procedimentoIds = Array.isArray(data.procedimento_ids)
      ? data.procedimento_ids
      : Array.isArray(data.procedimentoIds)
        ? data.procedimentoIds
        : [];
    this.createdAt = data.created_at || data.createdAt || null;
  }

  toDocument() {
    return {
      id: this.id,
      email: this.email,
      password_hash: this.passwordHash,
      name: this.name,
      role: this.role,
      funcao: this.funcao,
      specialty: this.funcao,
      commission_pct: this.commissionPct,
      photo: this.photo,
      active: this.active,
      procedimento_ids: this.procedimentoIds,
      created_at: this.createdAt,
    };
  }

  toPublic() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      funcao: this.funcao,
      specialty: this.funcao,
      commission_pct: this.commissionPct,
      photo: this.photo,
      active: this.active,
      procedimento_ids: this.procedimentoIds,
    };
  }
}
