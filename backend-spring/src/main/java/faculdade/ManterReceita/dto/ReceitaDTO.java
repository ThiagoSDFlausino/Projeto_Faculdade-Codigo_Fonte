package faculdade.ManterReceita.dto;

import java.util.Date;

import faculdade.ManterAgenda.model.Agenda;

public record ReceitaDTO(
    Integer agenda,
    Date dataConclusao,
    Float valorCobrado,
    Integer cliente,
    String nomeCliente,
    Integer profissional,
    String nomeProfissional,
    Integer procedimento,
    String nomeProcedimento
) {

    public static ReceitaDTO from(Agenda agenda) {
        return new ReceitaDTO(
            agenda.getId(),
            agenda.getDataConclusao(),
            agenda.getValorCobrado(),

            agenda.getCliente() == null
                ? null
                : agenda.getCliente().getId(),

            agenda.getCliente() == null
                ? null
                : agenda.getCliente().getNome(),

            agenda.getProfissional() == null
                ? null
                : agenda.getProfissional().getId(),

            agenda.getProfissional() == null
                ? null
                : agenda.getProfissional().getNome(),

            agenda.getProcedimento() == null
                ? null
                : agenda.getProcedimento().getId(),

            agenda.getProcedimento() == null
                ? null
                : agenda.getProcedimento().getNome()
        );
    }
}
