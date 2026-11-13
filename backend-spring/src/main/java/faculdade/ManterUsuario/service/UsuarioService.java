package faculdade.ManterUsuario.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;

@Service
public class UsuarioService {

	@Autowired
	private UsuarioRepository usuarioRepository;

	public Iterable<Usuario> getAll() {
		return usuarioRepository.findAll();
	}

	public Usuario save(Usuario a) {
		return usuarioRepository.save(a);
	}

	public Optional<Usuario> findById(Integer id) {
		return usuarioRepository.findById(id);
	}

	public void deleteById(Integer id) {
		usuarioRepository.deleteById(id);
	}

}
