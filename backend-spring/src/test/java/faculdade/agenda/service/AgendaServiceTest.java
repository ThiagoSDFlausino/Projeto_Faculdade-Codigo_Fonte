package faculdade.ManterAgenda.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertSame;
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

    public static final Procedimento procedimento_VALIDO =
        new Procedimento(
            1,
            "Limpeza de Pele",
            "Procedimento de limpeza facial.",
            60,
            150.00f,
            true,
            CategoriaProcedimento.ESTETICA_FACIAL
        );

    public static final Cliente cliente_VALIDO = new Cliente();

    static {
        cliente_VALIDO.setId(1);
        cliente_VALIDO.setNome("Cliente Teste");
    }

    public static final Usuario profissional_VALIDO = new Usuario(
        1,
        "Profissional Teste",
        "profissional@exemplo.com",
        "senha-teste",
        "Atendimento",
        Perfil.PROFISSIONAL,
        procedimento_VALIDO
    );

    public static final Agenda agenda_VALIDA = new Agenda(
        null,
        new Date(0L),
        new Date(3600000L),
        "Agendamento de teste.",
        profissional_VALIDO,
        cliente_VALIDO,
        procedimento_VALIDO,
        StatusAgenda.AGENDADO
    );

    public static final Agenda agenda_INVALIDA = new Agenda(
        null,
        null,
        null,
        "Agendamento inválido.",
        null,
        null,
        null,
        null
    );

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

    @Test
    void criarAgenda_ComDadosValidos_RetornaAgenda() {

        when(clienteRepository.findById(1))
            .thenReturn(Optional.of(cliente_VALIDO));

        when(usuarioRepository.findByIdParaAgendamento(1))
            .thenReturn(Optional.of(profissional_VALIDO));

        when(procedimentoRepository.findById(1))
            .thenReturn(Optional.of(procedimento_VALIDO));

        when(agendaRepository.existeConflito(
            1,
            agenda_VALIDA.getDataHoraInicio(),
            agenda_VALIDA.getDataHoraFim(),
            -1,
            StatusAgenda.CANCELADO
        )).thenReturn(false);

        when(agendaRepository.save(agenda_VALIDA))
            .thenReturn(agenda_VALIDA);

        Agenda a = agendaService.save(agenda_VALIDA);

        assertSame(a, agenda_VALIDA);
        assertThat(a).isEqualTo(agenda_VALIDA);
    }

    @Test
    void criarAgenda_ComDadosInvalidos_ThrowsException() {

        assertThatThrownBy(() ->
            agendaService.save(agenda_INVALIDA)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Informe a data e hora de início e de fim!");
    }

    @Test
    void excluirAgenda_ComIdExistente() {

        assertThatCode(() ->
            agendaService.deleteById(1)
        ).doesNotThrowAnyException();
    }

    @Test
    void excluirAgenda_ComIdInexistente_ThrowException() {

        doThrow(new RuntimeException())
            .when(agendaRepository)
            .deleteById(99);

        assertThatThrownBy(() ->
            agendaService.deleteById(99)
        ).isInstanceOf(RuntimeException.class);
    }

    @Test
    void chamar_getAll() {

        List<Agenda> agendas = new ArrayList<>();
        agendas.add(agenda_INVALIDA);
        agendas.add(agenda_VALIDA);
        agendas.add(agenda_VALIDA);

        when(agendaRepository.findAll()).thenReturn(agendas);

        List<Agenda> result =
            (List<Agenda>) agendaService.getAll();

        log.info(result.size());

        assertThat(result).isNotEmpty();
        assertThat(result.size()).isEqualTo(3);
        assertThat(result).hasSize(3);
        assertThat(result.get(0)).isEqualTo(agenda_INVALIDA);
    }

    @Test
    void criarAgenda_ComHorarioOcupado_ThrowsException() {

        when(clienteRepository.findById(1))
            .thenReturn(Optional.of(cliente_VALIDO));

        when(usuarioRepository.findByIdParaAgendamento(1))
            .thenReturn(Optional.of(profissional_VALIDO));

        when(procedimentoRepository.findById(1))
            .thenReturn(Optional.of(procedimento_VALIDO));

        when(agendaRepository.existeConflito(
            1,
            agenda_VALIDA.getDataHoraInicio(),
            agenda_VALIDA.getDataHoraFim(),
            -1,
            StatusAgenda.CANCELADO
        )).thenReturn(true);

        assertThatThrownBy(() ->
            agendaService.save(agenda_VALIDA)
        )
            .isInstanceOf(AgendaConflitoException.class)
            .hasMessage(
                "O profissional já possui um agendamento "
                    + "que ocupa parte ou todo esse intervalo!"
            );
    }

    @Test
    void criarAgenda_ComFimIgualAoInicio_ThrowsException() {

        Agenda agenda = new Agenda(
            null,
            new Date(0L),
            new Date(0L),
            "Horário inválido.",
            profissional_VALIDO,
            cliente_VALIDO,
            procedimento_VALIDO,
            StatusAgenda.AGENDADO
        );

        assertThatThrownBy(() ->
            agendaService.save(agenda)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(
                "O horário final deve ser posterior ao horário inicial!"
            );
    }

    @Test
    void criarAgenda_ComFimAnteriorAoInicio_ThrowsException() {

        Agenda agenda = new Agenda(
            null,
            new Date(3600000L),
            new Date(0L),
            "Horário inválido.",
            profissional_VALIDO,
            cliente_VALIDO,
            procedimento_VALIDO,
            StatusAgenda.AGENDADO
        );

        assertThatThrownBy(() ->
            agendaService.save(agenda)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(
                "O horário final deve ser posterior ao horário inicial!"
            );
    }

    @Test
    void criarAgenda_ComClienteInexistente_ThrowsException() {

        when(clienteRepository.findById(1))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            agendaService.save(agenda_VALIDA)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Cliente não cadastrado!");
    }

    @Test
    void criarAgenda_ComProfissionalInexistente_ThrowsException() {

        when(clienteRepository.findById(1))
            .thenReturn(Optional.of(cliente_VALIDO));

        when(usuarioRepository.findByIdParaAgendamento(1))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            agendaService.save(agenda_VALIDA)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Profissional não cadastrado!");
    }

    @Test
    void criarAgenda_ComUsuarioADM_ThrowsException() {

        Usuario usuarioADM = new Usuario(
            1,
            "Administrador Teste",
            "adm@exemplo.com",
            "senha-teste",
            null,
            Perfil.ADM,
            null
        );

        when(clienteRepository.findById(1))
            .thenReturn(Optional.of(cliente_VALIDO));

        when(usuarioRepository.findByIdParaAgendamento(1))
            .thenReturn(Optional.of(usuarioADM));

        assertThatThrownBy(() ->
            agendaService.save(agenda_VALIDA)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(
                "O usuário selecionado não possui perfil PROFISSIONAL!"
            );
    }

    @Test
    void criarAgenda_ComProcedimentoInexistente_ThrowsException() {

        when(clienteRepository.findById(1))
            .thenReturn(Optional.of(cliente_VALIDO));

        when(usuarioRepository.findByIdParaAgendamento(1))
            .thenReturn(Optional.of(profissional_VALIDO));

        when(procedimentoRepository.findById(1))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            agendaService.save(agenda_VALIDA)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Procedimento não cadastrado!");
    }

    @Test
    void criarAgenda_ComProcedimentoDiferenteDoProfissional_ThrowsException() {

        Procedimento outroProcedimento = new Procedimento(
            2,
            "Outro Procedimento",
            "Procedimento diferente.",
            60,
            200.00f,
            true,
            CategoriaProcedimento.GERAL
        );

        Agenda agenda = new Agenda(
            null,
            new Date(0L),
            new Date(3600000L),
            "Procedimento incompatível.",
            profissional_VALIDO,
            cliente_VALIDO,
            outroProcedimento,
            StatusAgenda.AGENDADO
        );

        when(clienteRepository.findById(1))
            .thenReturn(Optional.of(cliente_VALIDO));

        when(usuarioRepository.findByIdParaAgendamento(1))
            .thenReturn(Optional.of(profissional_VALIDO));

        when(procedimentoRepository.findById(2))
            .thenReturn(Optional.of(outroProcedimento));

        assertThatThrownBy(() ->
            agendaService.save(agenda)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(
                "O procedimento não corresponde ao vinculado "
                    + "ao profissional!"
            );
    }

    @Test
    void atualizarAgenda_IgnoraProprioIdNaConsultaDeConflito() {

        Agenda agenda = new Agenda(
            10,
            new Date(0L),
            new Date(3600000L),
            "Atualização de teste.",
            profissional_VALIDO,
            cliente_VALIDO,
            procedimento_VALIDO,
            StatusAgenda.AGENDADO
        );

        when(clienteRepository.findById(1))
            .thenReturn(Optional.of(cliente_VALIDO));

        when(usuarioRepository.findByIdParaAgendamento(1))
            .thenReturn(Optional.of(profissional_VALIDO));

        when(procedimentoRepository.findById(1))
            .thenReturn(Optional.of(procedimento_VALIDO));

        when(agendaRepository.existeConflito(
            1,
            agenda.getDataHoraInicio(),
            agenda.getDataHoraFim(),
            10,
            StatusAgenda.CANCELADO
        )).thenReturn(false);

        when(agendaRepository.save(agenda)).thenReturn(agenda);

        Agenda a = agendaService.save(agenda);

        assertSame(a, agenda);
        assertThat(a.getId()).isEqualTo(10);
    }

    @Test
    void salvarAgendaCancelada_NaoConsultaConflito() {

        Agenda agenda = new Agenda(
            10,
            new Date(0L),
            new Date(3600000L),
            "Cancelamento de teste.",
            profissional_VALIDO,
            cliente_VALIDO,
            procedimento_VALIDO,
            StatusAgenda.CANCELADO
        );

        when(clienteRepository.findById(1))
            .thenReturn(Optional.of(cliente_VALIDO));

        when(usuarioRepository.findByIdParaAgendamento(1))
            .thenReturn(Optional.of(profissional_VALIDO));

        when(procedimentoRepository.findById(1))
            .thenReturn(Optional.of(procedimento_VALIDO));

        when(agendaRepository.save(agenda)).thenReturn(agenda);

        Agenda a = agendaService.save(agenda);

        assertSame(a, agenda);
        assertThat(a.getStatusAgenda()).isEqualTo(StatusAgenda.CANCELADO);

        org.mockito.Mockito.verify(
            agendaRepository,
            org.mockito.Mockito.never()
        ).existeConflito(
            org.mockito.ArgumentMatchers.anyInt(),
            org.mockito.ArgumentMatchers.any(Date.class),
            org.mockito.ArgumentMatchers.any(Date.class),
            org.mockito.ArgumentMatchers.anyInt(),
            org.mockito.ArgumentMatchers.any(StatusAgenda.class)
        );
    }
}