/** DTO de resumo do fluxo de caixa. */
export class Fluxo {
  constructor(data = {}) {
    this.entradas = data.entradas || [];
    this.saidas = data.saidas || [];
    this.totalEntradas = data.total_entradas ?? data.totalEntradas ?? 0;
    this.totalSaidas = data.total_saidas ?? data.totalSaidas ?? 0;
    this.saldo = data.saldo ?? (this.totalEntradas - this.totalSaidas);
  }

  toDocument() {
    return {
      entradas: this.entradas,
      saidas: this.saidas,
      total_entradas: this.totalEntradas,
      total_saidas: this.totalSaidas,
      saldo: this.saldo,
    };
  }
}
