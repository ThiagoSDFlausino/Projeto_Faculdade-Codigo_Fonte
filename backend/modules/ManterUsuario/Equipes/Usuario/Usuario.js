import { PerfilUsuario } from "../Enum/PerfilUsuario.js";

/** Entidade de usuário. O banco guarda o mesmo formato em JSON. */
export class Usuario {
  constructor(data = {}) {
    this.id = data.id || "";
    this.email = data.email || "";
    this.name = data.name || "";
    this.role = data.role || PerfilUsuario.PROFISSIONAL;
    this.specialty = data.specialty || "";
    this.commissionPct = data.commission_pct ?? data.commissionPct ?? 0;
    this.photo = data.photo || "";
    this.active = data.active !== false;
    this.passwordHash = data.password_hash || data.passwordHash || "";
    this.createdAt = data.created_at || data.createdAt || null;
  }

  toDocument() {
    return {
      id: this.id,
      email: this.email,
      password_hash: this.passwordHash,
      name: this.name,
      role: this.role,
      specialty: this.specialty,
      commission_pct: this.commissionPct,
      photo: this.photo,
      active: this.active,
      created_at: this.createdAt,
    };
  }

  toPublic() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      specialty: this.specialty,
      commission_pct: this.commissionPct,
      photo: this.photo,
      active: this.active,
    };
  }
}
