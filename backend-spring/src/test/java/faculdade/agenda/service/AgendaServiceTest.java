package faculdade.ManterAgenda.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
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
    void criarAgenda_ComDadosInvalidos_ThrowsException() {

        Agenda agenda = new Agenda();

        assertThatThrownBy(() -> agendaService.save(agenda))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Informe a data e hora de início e de fim!");
    }

    @Test
    void excluirAgenda_ComIdExistente() {

        Agenda agenda = criarAgenda(1, StatusAgenda.AGENDADO);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(agenda));

        assertThatCode(() -> agendaService.deleteById(1))
            .doesNotThrowAnyException();
    }

    @Test
    void excluirAgenda_QuandoRepositoryFalha_ThrowsException() {

        Agenda agenda = criarAgenda(1, StatusAgenda.AGENDADO);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(agenda));

        doThrow(new RuntimeException())
            .when(agendaRepository)
            .deleteById(1);

        assertThatThrownBy(() -> agendaService.deleteById(1))
            .isInstanceOf(RuntimeException.class);
    }

    @Test
    void chamar_getAll() {

        Agenda agenda = criarAgenda(1, StatusAgenda.AGENDADO);

        List<Agenda> agendas = new ArrayList<>();
        agendas.add(agenda);

        when(agendaRepository.findAll()).thenReturn(agendas);

        Iterable<Agenda> resultado = agendaService.getAll();

        log.info(agendas.size());

        assertThat(resultado).containsExactly(agenda);
    }

    @Test
    void criarAgenda_ComHorarioOcupado_ThrowsException() {

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

    @Test
    void concluirAgenda_RegistraPrecoEData() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONFIRMADO);
        Agenda atualizacao = criarAgenda(1, StatusAgenda.CONCLUIDO);

        configurarReferencias(atualizacao);
        configurarSemConflito(atualizacao);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        when(agendaRepository.save(atualizacao))
            .thenReturn(atualizacao);

        Date antes = new Date();

        Agenda resultado = agendaService.save(atualizacao);

        Date depois = new Date();

        assertThat(resultado.getValorCobrado()).isEqualTo(100.00f);
        assertThat(resultado.getDataConclusao()).isNotNull();
        assertThat(resultado.getDataConclusao())
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

        configurarReferencias(atualizacao);
        configurarSemConflito(atualizacao);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        when(agendaRepository.save(atualizacao))
            .thenReturn(atualizacao);

        Agenda resultado = agendaService.save(atualizacao);

        assertThat(resultado.getValorCobrado()).isEqualTo(100.00f);
        assertThat(resultado.getDataConclusao())
            .isEqualTo(new Date(7200000L));
    }

    @Test
    void alterarStatusAposReceita_ThrowsException() {

        Agenda anterior = criarAgenda(1, StatusAgenda.CONCLUIDO);
        anterior.setValorCobrado(100.00f);
        anterior.setDataConclusao(new Date(7200000L));

        Agenda atualizacao = criarAgenda(1, StatusAgenda.CANCELADO);

        configurarReferencias(atualizacao);

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(anterior));

        assertThatThrownBy(() -> agendaService.save(atualizacao))
            .isInstanceOf(AgendaConflitoException.class)
            .hasMessage(
                "Não é permitido alterar o status "
                    + "após o registro da receita!"
            );
    }

    @Test
    void excluirAgendaComReceita_ThrowsException() {

        Agenda agenda = criarAgenda(1, StatusAgenda.CONCLUIDO);
        agenda.setValorCobrado(100.00f);
        agenda.setDataConclusao(new Date(7200000L));

        when(agendaRepository.findByIdParaAtualizacao(1))
            .thenReturn(Optional.of(agenda));

        assertThatThrownBy(() -> agendaService.deleteById(1))
            .isInstanceOf(AgendaConflitoException.class);
    }

    @Test
    void concluirAgendaComPrecoAtual_RegistraNovoValor() {

        Agenda agenda = criarAgenda(null, StatusAgenda.CONCLUIDO);
        agenda.getProcedimento().setPreco(200.00f);

        configurarReferencias(agenda);
        configurarSemConflito(agenda);

        when(agendaRepository.save(agenda)).thenReturn(agenda);

        Agenda resultado = agendaService.save(agenda);

        assertThat(resultado.getValorCobrado()).isEqualTo(200.00f);
        assertThat(resultado.getDataConclusao()).isNotNull();
    }
}
