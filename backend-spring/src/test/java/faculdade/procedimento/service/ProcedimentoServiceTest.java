package faculdade.ManterProcedimento.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import faculdade.ManterProcedimento.model.CategoriaProcedimento;
import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterProcedimento.model.ProcedimentoRepository;
import lombok.extern.log4j.Log4j2;

@Log4j2
@ExtendWith(MockitoExtension.class)
class ProcedimentoServiceTest {

    public static final Procedimento procedimento_VALIDO = new Procedimento(
        null,
        "Limpeza de Pele",
        "Procedimento de limpeza facial.",
        60,
        150.00f,
        true,
        CategoriaProcedimento.ESTETICA_FACIAL
    );

    public static final Procedimento procedimento_INVALIDO = new Procedimento(
        null,
        "",
        "Procedimento inválido.",
        -1,
        -150.00f,
        true,
        CategoriaProcedimento.ESTETICA_FACIAL
    );

    @InjectMocks
    private ProcedimentoService procedimentoService;

    @Mock
    private ProcedimentoRepository procedimentoRepository;

    @Test
    void criarProcedimento_ComDadosValidos_RetornaProcedimento() {

        when(procedimentoRepository.save(procedimento_VALIDO))
            .thenReturn(procedimento_VALIDO);

        Procedimento a = procedimentoService.save(procedimento_VALIDO);

        assertSame(a, procedimento_VALIDO);
        assertThat(a).isEqualTo(procedimento_VALIDO);
    }

    @Test
    void criarProcedimento_ComDadosInvalidos_ThrowsException() {

        when(procedimentoRepository.save(procedimento_INVALIDO))
            .thenThrow(RuntimeException.class);

        assertThatThrownBy(() ->
            procedimentoService.save(procedimento_INVALIDO)
        ).isInstanceOf(RuntimeException.class);
    }

    @Test
    void excluirProcedimento_ComIdExistente() {

        assertThatCode(() ->
            procedimentoService.deleteById(1)
        ).doesNotThrowAnyException();
    }

    @Test
    void excluirProcedimento_ComIdInexistente_ThrowException() {

        doThrow(new RuntimeException())
            .when(procedimentoRepository)
            .deleteById(99);

        assertThatThrownBy(() ->
            procedimentoService.deleteById(99)
        ).isInstanceOf(RuntimeException.class);
    }

    @Test
    void chamar_getAll() {

        List<Procedimento> procedimentos = new ArrayList<>();
        procedimentos.add(procedimento_INVALIDO);
        procedimentos.add(procedimento_VALIDO);
        procedimentos.add(procedimento_VALIDO);

        when(procedimentoRepository.findAll()).thenReturn(procedimentos);

        List<Procedimento> result =
            (List<Procedimento>) procedimentoService.getAll();

        log.info(result.size());

        assertThat(result).isNotEmpty();
        assertThat(result.size()).isEqualTo(3);
        assertThat(result).hasSize(3);
        assertThat(result.get(0)).isEqualTo(procedimento_INVALIDO);
    }
}
