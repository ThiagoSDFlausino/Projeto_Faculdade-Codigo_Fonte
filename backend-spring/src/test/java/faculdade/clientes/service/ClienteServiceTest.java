package faculdade.ManterClientes.service;

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

import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterClientes.model.ClienteRepository;
import faculdade.ManterClientes.model.StatusCliente;
import lombok.extern.log4j.Log4j2;

@Log4j2
@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    public static final Cliente cliente_VALIDO = new Cliente(
        null,
        "Cliente Teste",
        "11999999999",
        "cliente@exemplo.com",
        new Date(0L),
        "",
        List.of("Teste"),
        "Cliente cadastrado para teste.",
        StatusCliente.ATIVO
    );

    public static final Cliente cliente_INVALIDO = new Cliente(
        null,
        "",
        "",
        "email-invalido",
        null,
        "",
        List.of(),
        "Cliente inválido.",
        null
    );

    @InjectMocks
    private ClienteService clienteService;

    @Mock
    private ClienteRepository clienteRepository;

    @Test
    void criarCliente_ComDadosValidos_RetornaCliente() {

        when(clienteRepository.save(cliente_VALIDO))
            .thenReturn(cliente_VALIDO);

        Cliente c = clienteService.save(cliente_VALIDO);

        assertSame(c, cliente_VALIDO);
        assertThat(c).isEqualTo(cliente_VALIDO);
    }

    @Test
    void criarCliente_ComDadosInvalidos_ThrowsException() {

        when(clienteRepository.save(cliente_INVALIDO))
            .thenThrow(RuntimeException.class);

        assertThatThrownBy(() ->
            clienteService.save(cliente_INVALIDO)
        ).isInstanceOf(RuntimeException.class);
    }

    @Test
    void excluirCliente_ComIdExistente() {

        assertThatCode(() ->
            clienteService.deleteById(1)
        ).doesNotThrowAnyException();
    }

    @Test
    void excluirCliente_ComIdInexistente_ThrowException() {

        doThrow(new RuntimeException())
            .when(clienteRepository)
            .deleteById(99);

        assertThatThrownBy(() ->
            clienteService.deleteById(99)
        ).isInstanceOf(RuntimeException.class);
    }

    @Test
    void chamar_getAll() {

        List<Cliente> clientes = new ArrayList<>();
        clientes.add(cliente_INVALIDO);
        clientes.add(cliente_VALIDO);
        clientes.add(cliente_VALIDO);

        when(clienteRepository.findAll()).thenReturn(clientes);

        List<Cliente> result =
            (List<Cliente>) clienteService.getAll();

        log.info(result.size());

        assertThat(result).isNotEmpty();
        assertThat(result.size()).isEqualTo(3);
        assertThat(result).hasSize(3);
        assertThat(result.get(0)).isEqualTo(cliente_INVALIDO);
    }
}