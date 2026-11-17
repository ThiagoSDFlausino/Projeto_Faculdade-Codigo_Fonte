package faculdade.ManterAgenda.dto;

import java.time.LocalDate;
import java.util.List;

import faculdade.ManterDespesa.dto.DespesaDTO;

public record FechamentoDTO(
    LocalDate periodoInicio,
    LocalDate periodoFim,
    Float totalFaturamento,
    Float totalDespesas,
    Float resultado,
    Float totalAReceber,
    Integer totalAtendimentos,
    List<ProfissionalResumoDTO> porProfissional,
    List<AgendaDTO> atendimentos,
    List<DespesaDTO> despesas
) {

    public record ProfissionalResumoDTO(
        Integer profissional,
        String nome,
        String funcao,
        Integer totalAtendimentos,
        Float totalFaturamento
    ) {
    }
}
