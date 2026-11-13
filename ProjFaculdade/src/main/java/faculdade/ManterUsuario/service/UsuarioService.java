package faculdade.ManterUsuario.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;

@Service
public class UsuarioService {

	@Autowired
	private UsuarioRepository UsuarioRepository;

	public Iterable<Usuario> getAll() {
		return UsuarioRepository.findAll();
	}

	public Usuario save(Usuario a) {
		return UsuarioRepository.save(a);
	}

	public Optional<Usuario> findById(Integer id) {
		return UsuarioRepository.findById(id);
	}

	public void deleteById(Integer id) {
		UsuarioRepository.deleteById(id);
	}

}
