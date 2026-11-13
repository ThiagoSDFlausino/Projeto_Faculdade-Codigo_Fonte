package faculdade.ManterReceita.dto;

import java.util.List;

public record ReceitaResumoDTO(
    List<ReceitaDTO> receitas,
    Integer quantidade,
    Float totalReceitas
) {
}
