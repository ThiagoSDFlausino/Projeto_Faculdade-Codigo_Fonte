package faculdade.ManterDespesa.model;

import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

public interface DespesaRepository
        extends CrudRepository<Despesa, Integer> {

    @Query("""
        SELECT d
        FROM Despesa d
        LEFT JOIN FETCH d.usuario
        WHERE d.data >= :inicio
          AND d.data < :fim
        ORDER BY d.data DESC, d.id DESC
        """)
    List<Despesa> findDespesasNoPeriodo(
        @Param("inicio") Date inicio,
        @Param("fim") Date fim
    );
}
