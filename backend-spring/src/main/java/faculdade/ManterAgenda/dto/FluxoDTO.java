package faculdade.ManterAgenda.dto;

import java.util.List;

import faculdade.ManterDespesa.dto.DespesaDTO;
import faculdade.ManterReceita.dto.ReceitaDTO;

public record FluxoDTO(
    List<ReceitaDTO> entradas,
    List<AgendaDTO> aReceber,
    List<DespesaDTO> saidas,
    Float totalEntradas,
    Float totalAReceber,
    Float totalSaidas,
    Float saldo
) {
}
