package faculdade.ManterDespesa.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import faculdade.ManterDespesa.dto.DespesaDTO;
import faculdade.ManterDespesa.model.Despesa;
import faculdade.ManterDespesa.model.DespesaRepository;
import faculdade.ManterDespesa.service.DespesaService;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.log4j.Log4j2;

@Tag(name = "despesas-api", description = "API para manter Despesas.")
@Log4j2
@RequestMapping(path = "/despesas-api")
@RestController
public class DespesaController {

    @Autowired
    private DespesaService despesaService;

    @Autowired
    private DespesaRepository despesaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Operation( summary = "Criar Despesa com objeto.", description = "Retorna o objeto criado." )
    @PostMapping(path = "/Despesas")
    public ResponseEntity<DespesaDTO> create( @Valid @RequestBody DespesaDTO despesaDTO) {

        log.info("Criando despesa.");

        try {
            if (despesaDTO.usuario().getId() == null) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            Optional<Usuario> usuarioData = usuarioRepository.findById( despesaDTO.usuario().getId() );

            if (usuarioData.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            Despesa despesa = new Despesa(
                null,
                despesaDTO.data(),
                despesaDTO.descricao(),
                despesaDTO.valor(),
                usuarioData.get()
            );

            Despesa despesaSalva = despesaService.save(despesa);

            return new ResponseEntity<>( DespesaDTO.from(despesaSalva), HttpStatus.CREATED );

        } catch (Exception e) {
            log.error("Erro ao criar despesa.", e);

            return new ResponseEntity<>( HttpStatus.INTERNAL_SERVER_ERROR );
        }
    }

    @Operation( summary = "Atualizar Despesa com objeto.", description = "Retorna uma mensagem. O ID deve existir." )
    @PutMapping("/Despesas/{id}")
    public ResponseEntity<String> update( @Valid @RequestBody DespesaDTO despesaDTO, @PathVariable Integer id) {

        log.info("Atualizando despesa de ID {}.", id);

        try {
            Optional<Despesa> despesaData = despesaService.findById(id);

            if (despesaData.isPresent()) {
                if (despesaDTO.usuario().getId() == null) {
                    return new ResponseEntity<>( "Informe o ID do usuário cadastrado!", HttpStatus.BAD_REQUEST );
                }

                Optional<Usuario> usuarioData = usuarioRepository.findById( despesaDTO.usuario().getId() );

                if (usuarioData.isEmpty()) {
                    return new ResponseEntity<>( "Usuário não cadastrado!", HttpStatus.BAD_REQUEST );
                }

                Despesa despesa = despesaData.get();

                despesa.setData(despesaDTO.data());
                despesa.setDescricao(despesaDTO.descricao());
                despesa.setValor(despesaDTO.valor());
                despesa.setUsuario(usuarioData.get());

                despesaService.save(despesa);

                return ResponseEntity.ok( "Despesa alterada com sucesso!" );

            } else {
                return new ResponseEntity<>( "Despesa não cadastrada!", HttpStatus.NOT_FOUND );
            }

        } catch (Exception e) {
            log.error("Erro ao atualizar despesa de ID {}.", id, e);

            return new ResponseEntity<>( "Ocorreu um erro inesperado!", HttpStatus.INTERNAL_SERVER_ERROR );
        }
    }

    @Operation( summary = "Exclui uma Despesa por ID.", description = "Retorna uma mensagem. O ID deve existir." )
    @DeleteMapping("/Despesas/{id}")
    public ResponseEntity<String> delete(@PathVariable Integer id) {

        log.info("Excluindo despesa de ID {}.", id);

        try {
            Optional<Despesa> despesaData =
                despesaService.findById(id);

            if (despesaData.isPresent()) {
                despesaService.deleteById(id);

                return ResponseEntity.ok("Despesa excluída com sucesso!");

            } else {
                return new ResponseEntity<>( "Despesa não cadastrada!", HttpStatus.NOT_FOUND );
            }

        } catch (Exception e) {
            log.error("Erro ao excluir despesa de ID {}.", id, e);

            return new ResponseEntity<>("Ocorreu um erro inesperado!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation( summary = "Recuperar Despesas.", description = "Retorna uma coleção de Despesas." )
    @GetMapping("/Despesas")
    public @ResponseBody Iterable<Despesa> getAll() {

        log.info("getAll()");

        return despesaRepository.findAll();
    }
}
