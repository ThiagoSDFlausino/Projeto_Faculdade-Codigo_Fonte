package faculdade.ManterAgenda.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import faculdade.ManterAgenda.dto.ReceitaResumoDTO;
import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterProcedimento.model.Procedimento;
import lombok.extern.log4j.Log4j2;

@Log4j2
@ExtendWith(MockitoExtension.class)
class AgendaReceitaServiceTest {

    @InjectMocks
    private AgendaService agendaService;

    @Mock
    private AgendaRepository agendaRepository;

    @Test
    void consultarReceitas_RetornaListaEValoresHistoricos() {

        Procedimento procedimento = new Procedimento();
        procedimento.setPreco(999.00f);

        Agenda primeira = new Agenda();
        primeira.setId(1);
        primeira.setStatusAgenda(StatusAgenda.CONCLUIDO);
        primeira.setValorCobrado(100.00f);
        primeira.setDataConclusao(new Date(0L));
        primeira.setProcedimento(procedimento);

        Agenda segunda = new Agenda();
        segunda.setId(2);
        segunda.setStatusAgenda(StatusAgenda.CONCLUIDO);
        segunda.setValorCobrado(200.00f);
        segunda.setDataConclusao(new Date(1000L));
        segunda.setProcedimento(procedimento);

        when(agendaRepository.findReceitas(
            eq(StatusAgenda.CONCLUIDO),
            any(Date.class),
            any(Date.class),
            eq((Integer) null),
            eq((Integer) null)
        )).thenReturn(List.of(segunda, primeira));

        ReceitaResumoDTO resultado =
            agendaService.obterReceitas(null, null, null, null);

        log.info(resultado.quantidade());

        assertThat(resultado.quantidade()).isEqualTo(2);
        assertThat(resultado.totalReceitas()).isEqualTo(300.00f);
        assertThat(resultado.receitas()).hasSize(2);
        assertThat(resultado.receitas().get(0).id()).isEqualTo(2);
        assertThat(resultado.receitas().get(0).valorCobrado())
            .isEqualTo(200.00f);
    }

    @Test
    void consultarReceitas_SemRegistros_RetornaTotalZero() {

        when(agendaRepository.findReceitas(
            eq(StatusAgenda.CONCLUIDO),
            any(Date.class),
            any(Date.class),
            eq((Integer) null),
            eq((Integer) null)
        )).thenReturn(List.of());

        ReceitaResumoDTO resultado =
            agendaService.obterReceitas(null, null, null, null);

        assertThat(resultado.receitas()).isEmpty();
        assertThat(resultado.quantidade()).isZero();
        assertThat(resultado.totalReceitas()).isEqualTo(0.00f);
    }

    @Test
    void consultarReceitas_ComPeriodoInvalido_ThrowsException() {

        assertThatThrownBy(() ->
            agendaService.obterReceitas(
                LocalDate.of(2026, 11, 30),
                LocalDate.of(2026, 11, 1),
                null,
                null
            )
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(
                "A data final não pode ser anterior à data inicial!"
            );
    }

    @Test
    void consultarReceitas_ComHistoricoIncompleto_ThrowsException() {

        when(agendaRepository.countReceitasSemHistorico(
            StatusAgenda.CONCLUIDO
        )).thenReturn(1L);

        assertThatThrownBy(() ->
            agendaService.obterReceitas(null, null, null, null)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void consultarReceitas_ComFiltros_RepassaParametros() {

        Date inicio = Date.from(
            Instant.parse("2026-11-01T00:00:00Z")
        );

        Date fim = Date.from(
            Instant.parse("2026-12-01T00:00:00Z")
        );

        when(agendaRepository.findReceitas(
            StatusAgenda.CONCLUIDO,
            inicio,
            fim,
            1,
            2
        )).thenReturn(List.of());

        ReceitaResumoDTO resultado = agendaService.obterReceitas(
            LocalDate.of(2026, 11, 1),
            LocalDate.of(2026, 11, 30),
            1,
            2
        );

        assertThat(resultado.quantidade()).isZero();
        assertThat(resultado.totalReceitas()).isEqualTo(0.00f);
    }

    @Test
    void consultarReceitas_ComProfissionalInvalido_ThrowsException() {

        assertThatThrownBy(() ->
            agendaService.obterReceitas(null, null, 0, null)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(
                "O filtro de profissional deve ser um ID positivo!"
            );
    }

    @Test
    void consultarReceitas_ComProcedimentoInvalido_ThrowsException() {

        assertThatThrownBy(() ->
            agendaService.obterReceitas(null, null, null, -1)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(
                "O filtro de procedimento deve ser um ID positivo!"
            );
    }

    @Test
    void consultarReceitas_ComValorNegativo_ThrowsException() {

        Agenda agenda = new Agenda();
        agenda.setId(1);
        agenda.setValorCobrado(-100.00f);

        when(agendaRepository.findReceitas(
            eq(StatusAgenda.CONCLUIDO),
            any(Date.class),
            any(Date.class),
            eq((Integer) null),
            eq((Integer) null)
        )).thenReturn(List.of(agenda));

        assertThatThrownBy(() ->
            agendaService.obterReceitas(null, null, null, null)
        ).isInstanceOf(IllegalStateException.class);
    }
}
