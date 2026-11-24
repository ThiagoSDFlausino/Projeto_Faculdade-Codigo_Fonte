/**
 * DTO utilizado para transportar os dados de receita resumo entre a API e o cliente.
 */
package faculdade.ManterAgenda.dto;

import java.util.List;

public record ReceitaResumoDTO(
    List<AgendaDTO> receitas,
    Integer quantidade,
    Float totalReceitas
) {
}
