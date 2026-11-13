package faculdade.ManterAgenda.dto;

import java.util.Date;

import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterUsuario.model.Usuario;
import jakarta.validation.constraints.NotNull;

public record AgendaDTO(
    Integer id,

    @NotNull(message = "A data e hora de início são obrigatórias!")
    Date dataHoraInicio,

    @NotNull(message = "A data e hora de fim são obrigatórias!")
    Date dataHoraFim,

    String observacoes,

    @NotNull(message = "O profissional é obrigatório!")
    Usuario profissional,

    @NotNull(message = "O cliente é obrigatório!")
    Cliente cliente,

    @NotNull(message = "O procedimento é obrigatório!")
    Procedimento procedimento,

    @NotNull(message = "O status da agenda é obrigatório!")
    StatusAgenda statusAgenda
) {

    public static AgendaDTO from(Agenda agenda) {
        return new AgendaDTO(
            agenda.getId(),
            agenda.getDataHoraInicio(),
            agenda.getDataHoraFim(),
            agenda.getObservacoes(),
            agenda.getProfissional(),
            agenda.getCliente(),
            agenda.getProcedimento(),
            agenda.getStatusAgenda()
        );
    }
}
