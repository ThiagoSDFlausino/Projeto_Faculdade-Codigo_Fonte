/**
 * Camada de serviço de clientes. Concentra as regras de negócio relacionadas a clientes.
 */
package faculdade.ManterClientes.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterClientes.model.ClienteRepository;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    /**
     * Recupera todos os clientes cadastrados no banco de dados.
     *
     * @return lista contendo todos os clientes encontrados.
     */
    public Iterable<Cliente> getAll() {
        return clienteRepository.findAll();
    }

    /**
     * Cria um novo cliente com os dados fornecidos.
     *
     * @param c objeto contendo os dados do cliente a ser criado.
     * @return objeto criado.
     */
    public Cliente save(Cliente c) {
        return clienteRepository.save(c);
    }

    /**
     * Recupera um cliente específico com o ID fornecido.
     *
     * @param id ID do cliente a ser recuperado.
     * @return objeto contendo os dados do cliente encontrado.
     */
    public Optional<Cliente> findById(Integer id) {
        return clienteRepository.findById(id);
    }

    /**
     * Exclui um cliente existente com o ID fornecido.
     *
     * @param id ID do cliente a ser excluído.
     */
    public void deleteById(Integer id) {
        clienteRepository.deleteById(id);
    }
}