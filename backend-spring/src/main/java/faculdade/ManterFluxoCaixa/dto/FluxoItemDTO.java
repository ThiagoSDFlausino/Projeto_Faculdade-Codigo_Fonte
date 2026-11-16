package faculdade.ManterFluxoCaixa.dto;

import java.util.Date;

import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterFluxoCaixa.model.OrigemFluxo;

public record FluxoItemDTO(
    Integer registro,
    Date data,
    String descricao,
    Float valor,
    OrigemFluxo origem,
    StatusAgenda statusAgenda,
    String profissional,
    String usuario
) {
}
