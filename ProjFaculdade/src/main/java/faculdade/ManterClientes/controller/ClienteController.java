package faculdade.ManterClientes.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import faculdade.ManterClientes.dto.ClienteDTO;
import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterClientes.model.ClienteRepository;
import faculdade.ManterClientes.service.ClienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.log4j.Log4j2;

@Tag(name = "clientes-api", description = "API para manter Clientes.")
@Log4j2
@CrossOrigin(origins = "*")
@RequestMapping(path = "/clientes-api")
@RestController
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private ClienteRepository clienteRepository;

    @Operation(summary = "Criar Cliente com objeto.", description = "Retorna o objeto criado.")
    @PostMapping(path = "/Clientes")
    public ResponseEntity<ClienteDTO> create(@Valid @RequestBody ClienteDTO clienteDTO) {

        log.info("create( " + clienteDTO + " )");
        try {
            Cliente c = clienteService.save(new Cliente(
                null,
                clienteDTO.nome(),
                clienteDTO.telefone(),
                clienteDTO.email(),
                clienteDTO.dataNascimento(),
                clienteDTO.foto(),
                clienteDTO.tags(),
                clienteDTO.observacoes(),
                clienteDTO.statusCliente()
            ));

            return new ResponseEntity<>(ClienteDTO.from(c), HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Erro ao criar cliente: ", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Atualizar Cliente com objeto.", description = "Retorna uma mensagem. O Id deve existir.")
    @PutMapping("/Clientes/{id}")
    public ResponseEntity<String> update(@Valid @RequestBody ClienteDTO clienteDTO, @PathVariable Integer id) {

        log.info("update( " + clienteDTO + ", Id " + id + " )");

        Optional<Cliente> clienteData = clienteService.findById(id);

        try {
            if (clienteData.isPresent()) {
                Cliente c = new Cliente(
                    id,
                    clienteDTO.nome(),
                    clienteDTO.telefone(),
                    clienteDTO.email(),
                    clienteDTO.dataNascimento(),
                    clienteDTO.foto(),
                    clienteDTO.tags(),
                    clienteDTO.observacoes(),
                    clienteDTO.statusCliente()
                );
                clienteService.save(c);

                return ResponseEntity.ok("Cliente alterado com sucesso!");
            } else {
                return new ResponseEntity<>("Cliente não cadastrado!", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Ocorreu um erro inesperado!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Exclui um Cliente por Id.", description = "Retorna uma mensagem. O Id deve existir.")
    @DeleteMapping("/Clientes/{id}")
    public ResponseEntity<String> delete(@PathVariable Integer id) {

        log.info("delete( Id " + id + " )");

        try {
            Optional<Cliente> clienteData = clienteService.findById(id);

            if (clienteData.isPresent()) {
                clienteService.deleteById(id);
            } else {
                return new ResponseEntity<>("Cliente não cadastrado!", HttpStatus.NOT_FOUND);
            }
            return ResponseEntity.ok("Cliente excluído com sucesso!");

        } catch (Exception e) {
            return new ResponseEntity<>("Ocorreu um erro inesperado!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Recuperar Clientes.", description = "Retorna uma coleção de Clientes.")
    @GetMapping("/Clientes")
    public @ResponseBody Iterable<Cliente> getAll() {

        log.info("getAll()");

        return clienteRepository.findAll();
    }
}