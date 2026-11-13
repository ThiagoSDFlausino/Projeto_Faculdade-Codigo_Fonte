package faculdade.ManterAgenda.model;

import java.util.Date;
import java.util.Optional;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface AgendaRepository extends CrudRepository<Agenda, Integer> {

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM Agenda a
        WHERE a.profissional.id = :profissional
          AND a.statusAgenda <> :statusCancelado
          AND a.id <> :agendaIgnorada
          AND a.dataHoraInicio < :fim
          AND a.dataHoraFim > :inicio
        """)
    boolean existeConflito(
        @Param("profissional") Integer profissional,
        @Param("inicio") Date inicio,
        @Param("fim") Date fim,
        @Param("agendaIgnorada") Integer agendaIgnorada,
        @Param("statusCancelado") StatusAgenda statusCancelado
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Agenda a WHERE a.id = :id")
    Optional<Agenda> findByIdParaAtualizacao(@Param("id") Integer id);
}
