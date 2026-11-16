package faculdade.ManterFluxoCaixa.model;

import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.StatusAgenda;

public interface FluxoRepository extends Repository<Agenda, Integer> {

    @Query("""
        SELECT a
        FROM Agenda a
        LEFT JOIN FETCH a.cliente
        LEFT JOIN FETCH a.profissional
        LEFT JOIN FETCH a.procedimento
        WHERE a.statusAgenda = :status
          AND a.dataHoraInicio >= :inicio
          AND a.dataHoraInicio < :fim
        ORDER BY a.dataHoraInicio DESC, a.id DESC
        """)
    List<Agenda> findAgendasNoPeriodo(
        @Param("status") StatusAgenda status,
        @Param("inicio") Date inicio,
        @Param("fim") Date fim
    );
}
