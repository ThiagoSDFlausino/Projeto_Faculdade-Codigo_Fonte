/**
 * DTO utilizado para transportar os dados de fluxo entre a API e o cliente.
 */
package faculdade.ManterAgenda.dto;

import java.util.List;

import faculdade.ManterDespesa.dto.DespesaDTO;

public record FluxoDTO(
    List<AgendaDTO> entradas,
    List<AgendaDTO> aReceber,
    List<DespesaDTO> saidas,
    Float totalEntradas,
    Float totalAReceber,
    Float totalSaidas,
    Float saldo
) {
}
