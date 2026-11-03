export const StatusAgenda = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export function isStatusAgenda(status) {
  return Object.values(StatusAgenda).includes(status);
}
