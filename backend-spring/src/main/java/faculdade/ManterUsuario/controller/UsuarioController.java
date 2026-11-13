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
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;
import faculdade.ManterUsuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.log4j.Log4j2;

@Tag(name = "usuarios-api", description = "API para manter Usuarios.")
@Log4j2
@RequestMapping(path = "/usuarios-api")
@RestController
public class UsuarioController {

	@Autowired
	private UsuarioService UsuarioService;

	@Autowired
	private UsuarioRepository UsuarioRepository;

	@Operation(summary = "Criar Usuario com parametros.", description = "Retorna uma mensagem.")
	@PostMapping(path = "/Usuarios/param")
	public ResponseEntity<String> createString(@RequestParam String nome, @RequestParam String email) {

		log.info("createString( " + nome + ", " + email + " )");

		try {
			Usuario a = new Usuario(nome, email);
			UsuarioService.save(a);
			
			return new ResponseEntity<>("Usuario criado com sucesso!", HttpStatus.CREATED);
		} catch (Exception e) {
			log.info("Exceção = " + e); 			
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Operation(summary = "Criar Usuario com objeto.", description = "Retorna o objeto criado.")
	@PostMapping(path = "/Usuarios")
	public ResponseEntity<UsuarioDTO> create(@Valid @RequestBody UsuarioDTO UsuarioDTO) {

		log.info("create( " + UsuarioDTO + " )");
		try {
			Usuario a = UsuarioService.save(new Usuario(UsuarioDTO.getNome(), UsuarioDTO.getEmail()));
			
			return new ResponseEntity<>(UsuarioDTO.from(a), HttpStatus.CREATED);
		} catch (Exception e) {
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Operation(summary = "Atualizar Usuario com objeto.", description = "Retorna uma mensagem. O Id deve existir.")
	@PutMapping("/Usuarios/{id}")
	public ResponseEntity<String> update(@Valid @RequestBody UsuarioDTO UsuarioDTO, @PathVariable Integer id) {

		log.info("update( " + UsuarioDTO + ", Id " + id + " )");

		Optional<Usuario> UsuarioData = UsuarioService.findById(id);

		try {
			if (UsuarioData.isPresent()) {
				Usuario a = new Usuario(UsuarioDTO.getNome(), UsuarioDTO.getEmail());
				UsuarioService.save(a);
				
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

			Optional<Usuario> UsuarioData = UsuarioService.findById(id);

			if (UsuarioData.isPresent()) {
				UsuarioService.deleteById(id);
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

		return UsuarioRepository.findAll();
	}

}
