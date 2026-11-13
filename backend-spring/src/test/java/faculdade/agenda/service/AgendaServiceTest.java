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

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterProcedimento.model.ProcedimentoRepository;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;
import lombok.extern.log4j.Log4j2;

@Log4j2
@ExtendWith(MockitoExtension.class)
class AgendaServiceTest {

    public static final Agenda agenda_VALIDA = new Agenda(
        null,
        new Date(0L),
        new Date(3600000L),
        "Agendamento de teste.",
        new Usuario(),
        new Cliente(),
        new Procedimento(),
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
    private UsuarioRepository usuarioRepository;

    @Mock
    private ProcedimentoRepository procedimentoRepository;

    @Test
    void criarAgenda_ComDadosValidos_RetornaAgenda() {

        when(agendaRepository.save(agenda_VALIDA))
            .thenReturn(agenda_VALIDA);

        Agenda a = agendaService.save(agenda_VALIDA);

        assertSame(a, agenda_VALIDA);
        assertThat(a).isEqualTo(agenda_VALIDA);
    }

    @Test
    void criarAgenda_ComDadosInvalidos_ThrowsException() {

        when(agendaRepository.save(agenda_INVALIDA))
            .thenThrow(RuntimeException.class);

        assertThatThrownBy(() ->
            agendaService.save(agenda_INVALIDA)
        ).isInstanceOf(RuntimeException.class);
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
}