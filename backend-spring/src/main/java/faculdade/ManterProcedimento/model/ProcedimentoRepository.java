/**
 * Repositório JPA para operações de banco de dados relacionadas a procedimentos.
 */
package faculdade.ManterProcedimento.model;

import org.springframework.data.repository.CrudRepository;

public interface ProcedimentoRepository extends CrudRepository<Procedimento, Integer> {

}
