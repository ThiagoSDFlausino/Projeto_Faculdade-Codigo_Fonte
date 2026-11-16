package faculdade.ManterFluxoCaixa.dto;

import java.util.List;

public record FluxoDTO(
    List<FluxoItemDTO> entradas,
    List<FluxoItemDTO> aReceber,
    List<FluxoItemDTO> saidas,
    Float totalEntradas,
    Float totalAReceber,
    Float totalSaidas,
    Float saldo
) {
}
