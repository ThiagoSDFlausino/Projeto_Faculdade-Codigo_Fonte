package demo.ManterUsuario.service;

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

import demo.Usuario.model.Usuario;
import demo.Usuario.model.UsuarioRepository;
import lombok.extern.log4j.Log4j2;

@Log4j2
@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

	public static final Usuario Usuario_VALIDO = new Usuario("Murakami", "murakami@ifsp.edu.br");
	public static final Usuario Usuario_INVALIDO = new Usuario("", "murakami.ifsp.edu.br");

	@InjectMocks
	private UsuarioService UsuarioService;

	@Mock
	private UsuarioRepository UsuarioRepository;

	@Test
	void criarUsuario_ComDadosValidos_RetornaUsuario() {

		when(UsuarioRepository.save(Usuario_VALIDO)).thenReturn(Usuario_VALIDO);

		Usuario a = UsuarioService.save(Usuario_VALIDO);

		assertSame(a, Usuario_VALIDO);
		assertThat(a).isEqualTo(Usuario_VALIDO);
	}

	@Test
	void criarUsuario_ComDadosInvalidos_ThrowsException() {

		when(UsuarioRepository.save(Usuario_INVALIDO)).thenThrow(RuntimeException.class);

		assertThatThrownBy(() -> UsuarioService.save(Usuario_INVALIDO)).isInstanceOf(RuntimeException.class);
	}

	@Test
	void excluirUsuario_ComIdExistente() {

		assertThatCode(() -> UsuarioService.deleteById(1));
	}

	@Test
	void excluirUsuario_ComIdInexistente_ThrowException() {

		doThrow(new RuntimeException()).when(UsuarioRepository).deleteById(99);

		assertThatThrownBy(() -> UsuarioService.deleteById(99)).isInstanceOf(RuntimeException.class);
	}

	@Test
	void chamar_getAll() {

		List<Usuario> Usuarios = new ArrayList<>();
		Usuarios.add(Usuario_INVALIDO);
		Usuarios.add(Usuario_VALIDO);
		Usuarios.add(Usuario_VALIDO);

		when(UsuarioRepository.findAll()).thenReturn(Usuarios);

		List<Usuario> result = (List<Usuario>) UsuarioService.getAll();
		log.info(result.size());

		assertThat(result).isNotEmpty();
		assertThat(result.size()).isEqualTo(3);
		assertSame(result.size(), 3);
		assertThat(result).hasSize(3);
		assertThat(result.get(0).equals(Usuario_INVALIDO));

	}

}
