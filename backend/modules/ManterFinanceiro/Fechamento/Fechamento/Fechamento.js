export class Fechamento {
  constructor(data = {}) {
    this.id = data.id || "";
    this.periodoInicio = data.periodo_inicio || data.periodoInicio || "";
    this.periodoFim = data.periodo_fim || data.periodoFim || "";
    this.totalFaturamento = data.total_faturamento ?? data.totalFaturamento ?? 0;
    this.totalDespesas = data.total_despesas ?? data.totalDespesas ?? 0;
    this.totalInsumos = data.total_insumos ?? data.totalInsumos ?? 0;
    this.lucroLiquido = data.lucro_liquido ?? data.lucroLiquido ?? 0;
    this.totalAtendimentos = data.total_atendimentos ?? data.totalAtendimentos ?? 0;
    this.porProfissional = data.por_profissional || data.porProfissional || data.comissoes_por_profissional || [];
    this.sessaoIds = data.sessao_ids || data.sessaoIds || [];
    this.geradoPorId = data.gerado_por_id || data.geradoPorId || "";
    this.geradoPorNome = data.gerado_por_nome || data.geradoPorNome || "";
    this.createdAt = data.created_at || data.createdAt || null;
  }

  toDocument() {
    return {
      id: this.id,
      periodo_inicio: this.periodoInicio,
      periodo_fim: this.periodoFim,
      total_faturamento: this.totalFaturamento,
      total_despesas: this.totalDespesas,
      total_insumos: this.totalInsumos,
      lucro_liquido: this.lucroLiquido,
      total_atendimentos: this.totalAtendimentos,
      por_profissional: this.porProfissional,
      sessao_ids: this.sessaoIds,
      gerado_por_id: this.geradoPorId,
      gerado_por_nome: this.geradoPorNome,
      created_at: this.createdAt,
    };
  }
}
