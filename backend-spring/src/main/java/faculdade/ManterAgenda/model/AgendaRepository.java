package faculdade.ManterAgenda.model;

import java.util.Date;
import java.util.List;
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

    @Query("""
        SELECT a
        FROM Agenda a
        LEFT JOIN FETCH a.cliente
        LEFT JOIN FETCH a.profissional
        LEFT JOIN FETCH a.procedimento
        WHERE a.statusAgenda = :status
          AND a.dataConclusao >= :inicio
          AND a.dataConclusao < :fim
          AND (:profissional IS NULL OR a.profissional.id = :profissional)
          AND (:procedimento IS NULL OR a.procedimento.id = :procedimento)
        ORDER BY a.dataConclusao DESC, a.id DESC
        """)
    List<Agenda> findReceitas(
        @Param("status") StatusAgenda status,
        @Param("inicio") Date inicio,
        @Param("fim") Date fim,
        @Param("profissional") Integer profissional,
        @Param("procedimento") Integer procedimento
    );

    @Query("""
        SELECT COUNT(a)
        FROM Agenda a
        WHERE a.statusAgenda = :status
          AND (a.dataConclusao IS NULL OR a.valorCobrado IS NULL)
        """)
    long countReceitasSemHistorico(
        @Param("status") StatusAgenda status
    );
}
