/**
 * Testes para o serviço de fechamento de agenda.
 */
package faculdade.ManterAgenda.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import faculdade.ManterAgenda.dto.FechamentoDTO;
import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterDespesa.model.Despesa;
import faculdade.ManterDespesa.model.DespesaRepository;
import faculdade.ManterUsuario.model.Usuario;

@ExtendWith(MockitoExtension.class)
class AgendaFechamentoServiceTest {

    @InjectMocks
    private AgendaService agendaService;

    @Mock
    private AgendaRepository agendaRepository;

    @Mock
    private DespesaRepository despesaRepository;

    @Test
    /**
     * Testa o cálculo de totais por profissional.
     */
    void obterFechamento_CalculaTotaisPorProfissional() {

        Usuario profissional = new Usuario();
        profissional.setId(3);
        profissional.setNome("Profissional Teste");

        Agenda primeira = new Agenda();
        primeira.setId(1);
        primeira.setStatusAgenda(StatusAgenda.CONCLUIDO);
        primeira.setValorCobrado(100.00f);
        primeira.setDataConclusao(new Date(0L));
        primeira.setProfissional(profissional);

        Agenda segunda = new Agenda();
        segunda.setId(2);
        segunda.setStatusAgenda(StatusAgenda.CONCLUIDO);
        segunda.setValorCobrado(200.00f);
        segunda.setDataConclusao(new Date(1000L));
        segunda.setProfissional(profissional);

        when(agendaRepository.findReceitas(
            eq(StatusAgenda.CONCLUIDO),
            any(Date.class),
            any(Date.class),
            eq((Integer) null),
            eq((Integer) null)
        )).thenReturn(List.of(segunda, primeira));

        when(agendaRepository.findAgendasNoPeriodo(
            eq(StatusAgenda.CONFIRMADO),
            any(Date.class),
            any(Date.class)
        )).thenReturn(List.of());

        when(despesaRepository.findDespesasNoPeriodo(
            any(Date.class),
            any(Date.class)
        )).thenReturn(List.of(
            new Despesa(
                1,
                new Date(0L),
                "Materiais",
                40.00f,
                null
            )
        ));

        FechamentoDTO resultado = agendaService.obterFechamento(
            LocalDate.of(2026, 11, 1),
            LocalDate.of(2026, 11, 30)
        );

        assertThat(resultado.totalFaturamento()).isEqualTo(300.00f);
        assertThat(resultado.totalDespesas()).isEqualTo(40.00f);
        assertThat(resultado.resultado()).isEqualTo(260.00f);
        assertThat(resultado.totalAtendimentos()).isEqualTo(2);
        assertThat(resultado.porProfissional()).hasSize(1);
        assertThat(
            resultado.porProfissional().get(0).totalAtendimentos()
        ).isEqualTo(2);
        assertThat(
            resultado.porProfissional().get(0).totalFaturamento()
        ).isEqualTo(300.00f);
    }

    @Test
    /**
     * Testa o lançamento de exceção quando o período é nulo.
     */
    void obterFechamento_SemPeriodo_ThrowsException() {

        assertThatThrownBy(() ->
            agendaService.obterFechamento(null, null)
        )
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Informe o início e o fim do período!");
    }

    @Test
    /**
     * Testa o lançamento de exceção quando o período é invertido.
     */
    void obterFechamento_ComPeriodoInvertido_ThrowsException() {

        assertThatThrownBy(() ->
            agendaService.obterFechamento(
                LocalDate.of(2026, 11, 30),
                LocalDate.of(2026, 11, 1)
            )
        ).isInstanceOf(IllegalArgumentException.class);
    }
}
