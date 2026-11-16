package faculdade.ManterAgenda.dto;

import java.util.List;

public record ReceitaResumoDTO(
    List<AgendaDTO> receitas,
    Integer quantidade,
    Float totalReceitas
) {
}
