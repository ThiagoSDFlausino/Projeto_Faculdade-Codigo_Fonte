/**
 * Repositório JPA para operações de banco de dados relacionadas a clientes.
 */
package faculdade.ManterClientes.model;

import org.springframework.data.repository.CrudRepository;

public interface ClienteRepository extends CrudRepository<Cliente, Integer> {

}