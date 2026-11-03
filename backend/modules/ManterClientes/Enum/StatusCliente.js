export const StatusCliente = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
};

export function isStatusCliente(status) {
  return Object.values(StatusCliente).includes(status);
}
