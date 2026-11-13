package faculdade.ManterUsuario.service;

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

import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;
import lombok.extern.log4j.Log4j2;

@Log4j2
@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

	public static final Usuario usuario_VALIDO = new Usuario(
    "Usuário Teste",
    "usuario@exemplo.com",
    "senha-teste",
    "Atendimento",
    Perfil.SECRETARIA
	);

	public static final Usuario usuario_INVALIDO = new Usuario(
		"",
		"email-invalido",
		"senha-teste",
		"Atendimento",
		Perfil.SECRETARIA
	);

	@InjectMocks
	private UsuarioService usuarioService;

	@Mock
	private UsuarioRepository usuarioRepository;

	@Test
	void criarUsuario_ComDadosValidos_RetornaUsuario() {

		when(usuarioRepository.save(usuario_VALIDO)).thenReturn(usuario_VALIDO);

		Usuario a = usuarioService.save(usuario_VALIDO);

		assertSame(a, usuario_VALIDO);
		assertThat(a).isEqualTo(usuario_VALIDO);
	}

	@Test
	void criarUsuario_ComDadosInvalidos_ThrowsException() {

		when(usuarioRepository.save(usuario_INVALIDO)).thenThrow(RuntimeException.class);

		assertThatThrownBy(() -> usuarioService.save(usuario_INVALIDO)).isInstanceOf(RuntimeException.class);
	}

	@Test
	void excluirUsuario_ComIdExistente() {

		assertThatCode(() -> usuarioService.deleteById(1));
	}

	@Test
	void excluirUsuario_ComIdInexistente_ThrowException() {

		doThrow(new RuntimeException()).when(usuarioRepository).deleteById(99);

		assertThatThrownBy(() -> usuarioService.deleteById(99)).isInstanceOf(RuntimeException.class);
	}

	@Test
	void chamar_getAll() {

		List<Usuario> usuarios = new ArrayList<>();
		usuarios.add(usuario_INVALIDO);
		usuarios.add(usuario_VALIDO);
		usuarios.add(usuario_VALIDO);

		when(usuarioRepository.findAll()).thenReturn(usuarios);

		List<Usuario> result = (List<Usuario>) usuarioService.getAll();
		log.info(result.size());

		assertThat(result).isNotEmpty();
		assertThat(result.size()).isEqualTo(3);
		assertSame(result.size(), 3);
		assertThat(result).hasSize(3);
		assertThat(result.get(0).equals(usuario_INVALIDO));

	}

}
