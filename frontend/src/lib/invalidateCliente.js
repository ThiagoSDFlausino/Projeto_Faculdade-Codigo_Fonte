export function invalidateClienteImpact(qc, clienteId) {
  const keys = [
    ["clientes"],
    ["dashboard"],
    ["commissions"],
    ["fluxo"],
    ["fechamento-preview"],
    ["fechamentos"],
    ["appointments"],
    ["transactions"],
    ["procedures-stats"],
  ];
  keys.forEach((queryKey) => {
    qc.invalidateQueries({ queryKey });
  });
  if (clienteId) {
    qc.invalidateQueries({ queryKey: ["cliente", clienteId] });
  }
}
