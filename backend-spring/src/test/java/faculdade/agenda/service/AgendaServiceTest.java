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

import faculdade.ManterAgenda.dto.FluxoDTO;
import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterDespesa.model.Despesa;
import faculdade.ManterDespesa.model.DespesaRepository;
import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterReceita.dto.ReceitaDTO;
import faculdade.ManterReceita.dto.ReceitaResumoDTO;
import faculdade.ManterReceita.service.ReceitaService;
import lombok.extern.log4j.Log4j2;

@Log4j2
@ExtendWith(MockitoExtension.class)
class AgendaFluxoServiceTest {

    @InjectMocks
    private AgendaService agendaService;

    @Mock
    private AgendaRepository agendaRepository;

    @Mock
    private ReceitaService receitaService;

    @Mock
    private DespesaRepository despesaRepository;

    @Test
    void consultarFluxo_CalculaEntradasSaidasEPrevisao() {

        Date data = Date.from(
            Instant.parse("2026-11-10T12:00:00Z")
        );

        ReceitaDTO receita = new ReceitaDTO(
            1,
            data,
            100.00f,
            1,
            "Cliente Teste",
            1,
            "Profissional Teste",
            1,
            "LASER"
        );

        when(receitaService.obter(null, null, null, null))
            .thenReturn(new ReceitaResumoDTO(
                List.of(receita),
                1,
                100.00f
            ));

        Procedimento procedimento = new Procedimento();
        procedimento.setId(1);
        procedimento.setNome("LASER");
        procedimento.setPreco(200.00f);

        Agenda confirmada = new Agenda();
        confirmada.setId(2);
        confirmada.setDataHoraInicio(data);
        confirmada.setStatusAgenda(StatusAgenda.CONFIRMADO);
        confirmada.setProcedimento(procedimento);

        when(agendaRepository.findAgendasNoPeriodo(
            eq(StatusAgenda.CONFIRMADO),
            any(Date.class),
            any(Date.class)
        )).thenReturn(List.of(confirmada));

        Despesa despesa = new Despesa(
            1,
            data,
            "Compra de materiais.",
            40.00f,
            null
        );

        when(despesaRepository.findDespesasNoPeriodo(
            any(Date.class),
            any(Date.class)
        )).thenReturn(List.of(despesa));

        FluxoDTO resultado =
            agendaService.obterFluxoCaixa(null, null);

        log.info(resultado.saldo());

        assertThat(resultado.entradas()).hasSize(1);
        assertThat(resultado.aReceber()).hasSize(1);
        assertThat(resultado.saidas()).hasSize(1);

        assertThat(resultado.totalEntradas()).isEqualTo(100.00f);
        assertThat(resultado.totalAReceber()).isEqualTo(200.00f);
        assertThat(resultado.totalSaidas()).isEqualTo(40.00f);
        assertThat(resultado.saldo()).isEqualTo(60.00f);

        assertThat(
            resultado.aReceber().get(0).procedimento().getPreco()
        ).isEqualTo(200.00f);
    }

    @Test
    void consultarFluxo_SemRegistros_RetornaZero() {

        when(receitaService.obter(null, null, null, null))
            .thenReturn(new ReceitaResumoDTO(
                List.of(),
                0,
                0.00f
            ));

        when(agendaRepository.findAgendasNoPeriodo(
            eq(StatusAgenda.CONFIRMADO),
            any(Date.class),
            any(Date.class)
        )).thenReturn(List.of());

        when(despesaRepository.findDespesasNoPeriodo(
            any(Date.class),
            any(Date.class)
        )).thenReturn(List.of());

        FluxoDTO resultado =
            agendaService.obterFluxoCaixa(null, null);

        assertThat(resultado.entradas()).isEmpty();
        assertThat(resultado.aReceber()).isEmpty();
        assertThat(resultado.saidas()).isEmpty();

        assertThat(resultado.totalEntradas()).isEqualTo(0.00f);
        assertThat(resultado.totalAReceber()).isEqualTo(0.00f);
        assertThat(resultado.totalSaidas()).isEqualTo(0.00f);
        assertThat(resultado.saldo()).isEqualTo(0.00f);
    }

    @Test
    void consultarFluxo_ComPeriodoInvalido_ThrowsException() {

        assertThatThrownBy(() ->
            agendaService.obterFluxoCaixa(
                LocalDate.of(2026, 11, 30),
                LocalDate.of(2026, 11, 1)
            )
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(
                "A data final não pode ser anterior à data inicial!"
            );
    }

    @Test
    void consultarFluxo_ComHistoricoIncompleto_ThrowsException() {

        when(receitaService.obter(null, null, null, null))
            .thenThrow(new IllegalStateException(
                "Histórico financeiro incompleto!"
            ));

        assertThatThrownBy(() ->
            agendaService.obterFluxoCaixa(null, null)
        )
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("Histórico financeiro incompleto!");
    }

    @Test
    void consultarFluxo_ComPeriodo_IncluiUltimoDiaCompleto() {

        LocalDate inicio = LocalDate.of(2026, 11, 1);
        LocalDate fim = LocalDate.of(2026, 11, 30);

        Date inicioConsulta = Date.from(
            Instant.parse("2026-11-01T00:00:00Z")
        );

        Date fimConsulta = Date.from(
            Instant.parse("2026-12-01T00:00:00Z")
        );

        when(receitaService.obter(inicio, fim, null, null))
            .thenReturn(new ReceitaResumoDTO(
                List.of(),
                0,
                0.00f
            ));

        when(agendaRepository.findAgendasNoPeriodo(
            StatusAgenda.CONFIRMADO,
            inicioConsulta,
            fimConsulta
        )).thenReturn(List.of());

        when(despesaRepository.findDespesasNoPeriodo(
            inicioConsulta,
            fimConsulta
        )).thenReturn(List.of());

        FluxoDTO resultado =
            agendaService.obterFluxoCaixa(inicio, fim);

        assertThat(resultado.saldo()).isEqualTo(0.00f);
    }
}
