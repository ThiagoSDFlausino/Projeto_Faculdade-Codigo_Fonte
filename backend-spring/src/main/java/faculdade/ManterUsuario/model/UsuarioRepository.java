package faculdade.ManterUsuario.model;

import java.util.Optional;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface UsuarioRepository extends CrudRepository<Usuario, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM Usuario u WHERE u.id = :id")
    Optional<Usuario> findByIdParaAgendamento(@Param("id") Integer id);
}
