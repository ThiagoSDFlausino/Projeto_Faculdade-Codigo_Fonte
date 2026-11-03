export const PerfilUsuario = {
  ADMIN: "admin",
  SECRETARIA: "secretaria",
  PROFISSIONAL: "profissional",
};

export function isPerfilUsuario(role) {
  return Object.values(PerfilUsuario).includes(role);
}
