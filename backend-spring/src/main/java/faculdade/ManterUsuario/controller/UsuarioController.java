package faculdade.ManterUsuario.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import faculdade.ManterUsuario.dto.UsuarioDTO;
import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;
import faculdade.ManterUsuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.log4j.Log4j2;

import faculdade.ManterUsuario.dto.UsuarioDTO;

@Tag(name = "usuarios-api", description = "API para manter Usuarios.")
@Log4j2
@RequestMapping(path = "/usuarios-api")
@RestController
public class UsuarioController {

	@Autowired
	private UsuarioService usuarioService;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Operation(summary = "Criar Usuario com parametros.", description = "Retorna uma mensagem.")
	@PostMapping(path = "/Usuarios/param")
	public ResponseEntity<String> createString(
		@RequestParam String nome, 
		@RequestParam String email, 
		@RequestParam String senha, 
		@RequestParam String funcao, 
		@RequestParam Perfil perfil) {

		log.info("createString( " + nome + ", " + email + " )");

		try {
			Usuario usuario = new Usuario(nome, email, senha, funcao, perfil);
			usuarioService.save(usuario);
			
			return new ResponseEntity<>("Usuario criado com sucesso!", HttpStatus.CREATED);
		} catch (Exception e) {
			log.info("Exceção = " + e); 			
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Operation(summary = "Criar Usuario com objeto.", description = "Retorna o objeto criado.")
	@PostMapping(path = "/Usuarios")
	public ResponseEntity<UsuarioDTO> create(@Valid @RequestBody UsuarioDTO usuarioDTO) {

		log.info("create( " + usuarioDTO + " )");

		try {
			Usuario usuario = new Usuario(
				usuarioDTO.nome(),
				usuarioDTO.email(),
				usuarioDTO.senha(),
				usuarioDTO.funcao(),
				usuarioDTO.perfil()
			);

			Usuario usuarioSalvo = usuarioService.save(usuario);

			return new ResponseEntity<>(UsuarioDTO.from(usuarioSalvo),HttpStatus.CREATED);

		} catch (Exception e) {
			log.error("Erro ao criar usuário.", e);

			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Operation(summary = "Atualizar Usuario com objeto.", description = "Retorna uma mensagem. O Id deve existir.")
	@PutMapping("/Usuarios/{id}")
	public ResponseEntity<String> update(@Valid @RequestBody UsuarioDTO usuarioDTO, @PathVariable Integer id) {

		log.info("update( " + usuarioDTO + ", Id " + id + " )");

		try {
			Optional<Usuario> usuarioData = usuarioService.findById(id);

			if (usuarioData.isPresent()) {
				Usuario usuario = usuarioData.get();

				usuario.setNome(usuarioDTO.nome());
				usuario.setEmail(usuarioDTO.email());
				usuario.setSenha(usuarioDTO.senha());
				usuario.setFuncao(usuarioDTO.funcao());
				usuario.setPerfil(usuarioDTO.perfil());

				usuarioService.save(usuario);
				
				return ResponseEntity.ok("Usuario alterado com sucesso!"); 
			} else {
				return new ResponseEntity<>("Usuario não cadastrado!", HttpStatus.NOT_FOUND);
			}
		} catch (Exception e) {
			return new ResponseEntity<>("Ocorreu um erro inexperado!", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Operation(summary = "Exclui um Usuario por Id.", description = "Retorna uma mensagem. O Id deve existir.")
	@DeleteMapping("/Usuarios/{id}")
	public ResponseEntity<String> delete(@PathVariable Integer id) {

		log.info("delete( Id " + id + " )");

		try {

			Optional<Usuario> UsuarioData = usuarioService.findById(id);

			if (UsuarioData.isPresent()) {
				usuarioService.deleteById(id);
			} else {
				return new ResponseEntity<>("Usuario não cadastrado!", HttpStatus.NOT_FOUND);
			}
			return ResponseEntity.ok("Usuario excluído com sucesso!");

		} catch (Exception e) {
			return new ResponseEntity<>("Ocorreu um erro inexperado!", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Operation(summary = "Recuperar Usuarios.", description = "Retorna uma coleção de Usuarios.")
	@GetMapping("/Usuarios")
	public @ResponseBody Iterable<Usuario> getAll() {

		log.info("getAll()");

		return usuarioRepository.findAll();
	}

}
