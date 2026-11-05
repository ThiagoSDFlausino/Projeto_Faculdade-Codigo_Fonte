export const PerfilUsuario = {
  ADMIN: "admin",
  SECRETARIA: "secretaria",
  PROFISSIONAL: "profissional",
};

export const PerfilUsuarioLabel = {
  [PerfilUsuario.ADMIN]: "Adm",
  [PerfilUsuario.SECRETARIA]: "Recepção",
  [PerfilUsuario.PROFISSIONAL]: "Profissional",
};

export function isPerfilUsuario(role) {
  return Object.values(PerfilUsuario).includes(role);
}
