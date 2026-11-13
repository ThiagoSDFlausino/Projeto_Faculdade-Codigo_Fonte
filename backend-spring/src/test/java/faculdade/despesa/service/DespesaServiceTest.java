package faculdade.ManterDespesa.service;

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

import faculdade.ManterDespesa.model.Despesa;
import faculdade.ManterDespesa.model.DespesaRepository;
import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;
import lombok.extern.log4j.Log4j2;

@Log4j2
@ExtendWith(MockitoExtension.class)
class DespesaServiceTest {

    public static final Usuario usuario_VALIDO = new Usuario(
        1,
        "Usuário Teste",
        "usuario@exemplo.com",
        "senha-teste",
        "Administração",
        Perfil.ADM,
        null
    );

    public static final Despesa despesa_VALIDA = new Despesa(
        null,
        new Date(0L),
        "Compra de materiais.",
        150.00f,
        usuario_VALIDO
    );

    public static final Despesa despesa_INVALIDA = new Despesa(
        null,
        null,
        "Despesa inválida.",
        null,
        null
    );

    @InjectMocks
    private DespesaService despesaService;

    @Mock
    private DespesaRepository despesaRepository;

    @Test
    void criarDespesa_ComDadosValidos_RetornaDespesa() {

        when(despesaRepository.save(despesa_VALIDA))
            .thenReturn(despesa_VALIDA);

        Despesa a = despesaService.save(despesa_VALIDA);

        assertSame(a, despesa_VALIDA);
        assertThat(a).isEqualTo(despesa_VALIDA);
    }

    @Test
    void criarDespesa_ComDadosInvalidos_ThrowsException() {

        when(despesaRepository.save(despesa_INVALIDA))
            .thenThrow(RuntimeException.class);

        assertThatThrownBy(() ->
            despesaService.save(despesa_INVALIDA)
        ).isInstanceOf(RuntimeException.class);
    }

    @Test
    void excluirDespesa_ComIdExistente() {

        assertThatCode(() ->
            despesaService.deleteById(1)
        ).doesNotThrowAnyException();
    }

    @Test
    void excluirDespesa_ComIdInexistente_ThrowException() {

        doThrow(new RuntimeException())
            .when(despesaRepository)
            .deleteById(99);

        assertThatThrownBy(() ->
            despesaService.deleteById(99)
        ).isInstanceOf(RuntimeException.class);
    }

    @Test
    void chamar_getAll() {

        List<Despesa> despesas = new ArrayList<>();
        despesas.add(despesa_INVALIDA);
        despesas.add(despesa_VALIDA);
        despesas.add(despesa_VALIDA);

        when(despesaRepository.findAll()).thenReturn(despesas);

        List<Despesa> result =
            (List<Despesa>) despesaService.getAll();

        log.info(result.size());

        assertThat(result).isNotEmpty();
        assertThat(result.size()).isEqualTo(3);
        assertThat(result).hasSize(3);
        assertThat(result.get(0)).isEqualTo(despesa_INVALIDA);
    }
}