package faculdade.ManterAgenda.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import faculdade.ManterAgenda.exception.AgendaConflitoException;
import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterClientes.model.ClienteRepository;
import faculdade.ManterProcedimento.model.CategoriaProcedimento;
import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterProcedimento.model.ProcedimentoRepository;
import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;
import lombok.extern.log4j.Log4j2;

@Log4j2
@ExtendWith(MockitoExtension.class)
class AgendaServiceTest {

    @InjectMocks
    private AgendaService agendaService;

    @Mock
    private AgendaRepository agendaRepository;

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ProcedimentoRepository procedimentoRepository;

    private Agenda criarAgenda(Integer id, StatusAgenda status) {

        Procedimento procedimento = new Procedimento(
            1,
            "LASER",
            "Procedimento de teste.",
            60,
            100.00f,
            true,
            CategoriaProcedimento.LASER
        );

        Cliente cliente = new Cliente();
        cliente.setId(1);

        Usuario profissional = new Usuario(
            1,
            "Profissional Teste",
            "profissional@exemplo.com",
            "senha-teste",
            null,
            Perfil.PROFISSIONAL,
            List.of(procedimento)
        );

        return new Agenda(
            id,
            new Date(0L),
            new Date(3600000L),
            null,
            null,
            "Agenda de teste.",
            profissional,
            cliente,
            procedimento,
            status
        );
    }

    private void configurarReferencias(Agenda agenda) {

        when(clienteRepository.findById(1))
            .thenReturn(Optional.of(agenda.getCliente()));

        when(usuarioRepository.findByIdParaAgendamento(1))
            .thenReturn(Optional.of(agenda.getProfissional()));

        when(procedimentoRepository.findById(1))
            .thenReturn(Optional.of(agenda.getProcedimento()));
    }

    private void configurarSemConflito(Agenda agenda) {

        Integer agendaIgnorada =
            agenda.getId() == null ? -1 : agenda.getId();

        when(agendaRepository.existeConflito(
            1,
            agenda.getDataHoraInicio(),
            agenda.getDataHoraFim(),
            agendaIgnorada,
            StatusAgenda.CANCELADO
        )).thenReturn(false);
    }

    @Test
    void criarAgenda_ComDadosValidos_RetornaAgenda() {

        Agenda agenda = criarAgenda(null, StatusAgenda.AGENDADO);

        configurarReferencias(agenda);
        configurarSemConflito(agenda);

        when(agendaRepository.save(agenda)).thenReturn(agenda);

        Agenda resultado = agendaService.save(agenda);

        assertThat(resultado).isSameAs(agenda);
        assertThat(resultado.getValorCobrado()).isNull();
        assertThat(resultado.getDataConclusao()).isNull();
    }

    @Test
    void concluirAgenda_RegistraPrecoEData() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONFIRMADO);
        Agenda atualizacao = criarAgenda(1, StatusAgenda.CONCLUIDO);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        configurarReferencias(atualizacao);
        configurarSemConflito(atualizacao);

        when(agendaRepository.save(atualizacao))
            .thenReturn(atualizacao);

        Date antes = new Date();
        Agenda resultado = agendaService.save(atualizacao);
        Date depois = new Date();

        assertThat(resultado.getValorCobrado()).isEqualTo(100.00f);
        assertThat(resultado.getDataConclusao())
            .isNotNull()
            .isAfterOrEqualTo(antes)
            .isBeforeOrEqualTo(depois);
    }

    @Test
    void editarAgendaConcluida_PreservaReceitaAnterior() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONCLUIDO);
        anterior.setValorCobrado(100.00f);
        anterior.setDataConclusao(new Date(7200000L));

        Agenda atualizacao = criarAgenda(1, StatusAgenda.CONCLUIDO);
        atualizacao.getProcedimento().setPreco(200.00f);
        atualizacao.setValorCobrado(999.00f);
        atualizacao.setDataConclusao(new Date(9999999L));
        atualizacao.setObservacoes("Observação atualizada.");

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        when(agendaRepository.save(anterior)).thenReturn(anterior);

        Agenda resultado = agendaService.save(atualizacao);

        assertThat(resultado).isSameAs(anterior);
        assertThat(resultado.getValorCobrado()).isEqualTo(100.00f);
        assertThat(resultado.getDataConclusao())
            .isEqualTo(new Date(7200000L));
        assertThat(resultado.getObservacoes())
            .isEqualTo("Observação atualizada.");
    }

    @Test
    void alterarStatusAposConclusao_ThrowsException() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONCLUIDO);
        anterior.setValorCobrado(100.00f);
        anterior.setDataConclusao(new Date(7200000L));

        Agenda atualizacao = criarAgenda(1, StatusAgenda.CANCELADO);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        assertThatThrownBy(() -> agendaService.save(atualizacao))
            .isInstanceOf(AgendaConflitoException.class)
            .hasMessage(
                "Não é permitido alterar o status "
                    + "de uma agenda já concluída!"
            );
    }

    @Test
    void alterarStatusDeConcluidaSemHistorico_ThrowsException() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONCLUIDO);
        Agenda atualizacao = criarAgenda(1, StatusAgenda.CONFIRMADO);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        assertThatThrownBy(() -> agendaService.save(atualizacao))
            .isInstanceOf(AgendaConflitoException.class)
            .hasMessage(
                "Não é permitido alterar o status "
                    + "de uma agenda já concluída!"
            );
    }

    @Test
    void editarConcluidaComHistoricoIncompleto_ThrowsException() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONCLUIDO);
        anterior.setValorCobrado(100.00f);

        Agenda atualizacao = criarAgenda(1, StatusAgenda.CONCLUIDO);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        assertThatThrownBy(() -> agendaService.save(atualizacao))
            .isInstanceOf(AgendaConflitoException.class)
            .hasMessage(
                "A agenda concluída possui histórico financeiro "
                    + "incompleto ou inválido. Regularize os dados "
                    + "antes de editá-la!"
            );
    }

    @Test
    void editarHistorico_AposRemoverHabilitacao_PermiteObservacoes() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONCLUIDO);
        anterior.setValorCobrado(100.00f);
        anterior.setDataConclusao(new Date(7200000L));
        anterior.getProfissional().setProcedimentos(List.of());

        Agenda atualizacao = criarAgenda(1, StatusAgenda.CONCLUIDO);
        atualizacao.setObservacoes("Atualização do histórico.");

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        when(agendaRepository.save(anterior)).thenReturn(anterior);

        Agenda resultado = agendaService.save(atualizacao);

        assertThat(resultado.getValorCobrado()).isEqualTo(100.00f);
        assertThat(resultado.getObservacoes())
            .isEqualTo("Atualização do histórico.");
    }

    @Test
    void alterarHorarioDeAgendaConcluida_ThrowsException() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONCLUIDO);
        anterior.setValorCobrado(100.00f);
        anterior.setDataConclusao(new Date(7200000L));

        Agenda atualizacao = criarAgenda(1, StatusAgenda.CONCLUIDO);
        atualizacao.setDataHoraFim(new Date(5400000L));

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        assertThatThrownBy(() -> agendaService.save(atualizacao))
            .isInstanceOf(AgendaConflitoException.class);
    }

    @Test
    void editarReceitaZero_PreservaValor() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONCLUIDO);
        anterior.setValorCobrado(0.00f);
        anterior.setDataConclusao(new Date(7200000L));

        Agenda atualizacao = criarAgenda(1, StatusAgenda.CONCLUIDO);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        when(agendaRepository.save(anterior)).thenReturn(anterior);

        Agenda resultado = agendaService.save(atualizacao);

        assertThat(resultado.getValorCobrado()).isEqualTo(0.00f);
    }

    @Test
    void excluirAgendaConcluida_ThrowsException() {

        Agenda agenda = criarAgenda(1, StatusAgenda.CONCLUIDO);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(agenda));

        assertThatThrownBy(() -> agendaService.deleteById(1))
            .isInstanceOf(AgendaConflitoException.class);
    }

    @Test
    void excluirAgendaSemReceita_Permitido() {

        Agenda agenda = criarAgenda(1, StatusAgenda.AGENDADO);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(agenda));

        assertThatCode(() -> agendaService.deleteById(1))
            .doesNotThrowAnyException();
    }

    @Test
    void criarAgendaComConflito_ThrowsException() {

        Agenda agenda = criarAgenda(null, StatusAgenda.AGENDADO);

        configurarReferencias(agenda);

        when(agendaRepository.existeConflito(
            1,
            agenda.getDataHoraInicio(),
            agenda.getDataHoraFim(),
            -1,
            StatusAgenda.CANCELADO
        )).thenReturn(true);

        assertThatThrownBy(() -> agendaService.save(agenda))
            .isInstanceOf(AgendaConflitoException.class);
    }
}