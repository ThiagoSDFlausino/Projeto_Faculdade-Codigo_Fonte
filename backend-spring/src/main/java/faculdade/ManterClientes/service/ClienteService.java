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

    public Iterable<Cliente> getAll() {
        return clienteRepository.findAll();
    }

    public Cliente save(Cliente c) {
        return clienteRepository.save(c);
    }

    public Optional<Cliente> findById(Integer id) {
        return clienteRepository.findById(id);
    }

    public void deleteById(Integer id) {
        clienteRepository.deleteById(id);
    }
}