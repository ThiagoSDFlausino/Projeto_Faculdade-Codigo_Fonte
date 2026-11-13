package faculdade.ManterProcedimento.controller;

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

import faculdade.ManterProcedimento.dto.ProcedimentoDTO;
import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterProcedimento.model.ProcedimentoRepository;
import faculdade.ManterProcedimento.service.ProcedimentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.log4j.Log4j2;

@Tag(name = "procedimentos-api", description = "API para manter Procedimentos.")
@Log4j2
@RequestMapping(path = "/procedimentos-api")
@RestController
public class ProcedimentoController {

    @Autowired
    private ProcedimentoService procedimentoService;

    @Autowired
    private ProcedimentoRepository procedimentoRepository;

    @Operation( summary = "Criar Procedimento com objeto.", description = "Retorna o objeto criado.")
    @PostMapping(path = "/Procedimentos")
    public ResponseEntity<ProcedimentoDTO> create(
            @Valid @RequestBody ProcedimentoDTO procedimentoDTO) {

        log.info("create( {} )", procedimentoDTO);

        try {
            Procedimento procedimento = new Procedimento(
                null,
                procedimentoDTO.nome(),
                procedimentoDTO.descricao(),
                procedimentoDTO.duracao(),
                procedimentoDTO.preco(),
                procedimentoDTO.ativo(),
                procedimentoDTO.categoriaProcedimento()
            );

            Procedimento procedimentoSalvo = procedimentoService.save(procedimento);

            return new ResponseEntity<>( ProcedimentoDTO.from(procedimentoSalvo), HttpStatus.CREATED);

        } catch (Exception e) {
            log.error("Erro ao criar procedimento.", e);

            return new ResponseEntity<>( HttpStatus.INTERNAL_SERVER_ERROR );
        }
    }

    @Operation( summary = "Atualizar Procedimento com objeto.", description = "Retorna uma mensagem. O ID deve existir.")
    @PutMapping("/Procedimentos/{id}")
    public ResponseEntity<String> update(
            @Valid @RequestBody ProcedimentoDTO procedimentoDTO,
            @PathVariable Integer id) {

        log.info("update( {}, Id {} )", procedimentoDTO, id);

        try {
            Optional<Procedimento> procedimentoData =
                procedimentoService.findById(id);

            if (procedimentoData.isPresent()) {
                Procedimento procedimento = procedimentoData.get();

                procedimento.setNome(procedimentoDTO.nome());
                procedimento.setDescricao(procedimentoDTO.descricao());
                procedimento.setDuracao(procedimentoDTO.duracao());
                procedimento.setPreco(procedimentoDTO.preco());
                procedimento.setAtivo(procedimentoDTO.ativo());
                procedimento.setCategoriaProcedimento( procedimentoDTO.categoriaProcedimento() );

                procedimentoService.save(procedimento);

                return ResponseEntity.ok( "Procedimento alterado com sucesso!" );

            } else {
                return new ResponseEntity<>( "Procedimento não cadastrado!", HttpStatus.NOT_FOUND);
            }

        } catch (Exception e) {
            log.error("Erro ao atualizar procedimento de ID {}.", id, e);

            return new ResponseEntity<>( "Ocorreu um erro inesperado!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation( summary = "Exclui um Procedimento por ID.", description = "Retorna uma mensagem. O ID deve existir.")
    @DeleteMapping("/Procedimentos/{id}")
    public ResponseEntity<String> delete(@PathVariable Integer id) {

        log.info("delete( Id {} )", id);

        try {
            Optional<Procedimento> procedimentoData = procedimentoService.findById(id);

            if (procedimentoData.isPresent()) { 
                procedimentoService.deleteById(id);

                return ResponseEntity.ok( "Procedimento excluído com sucesso!" );
            } else {
                return new ResponseEntity<>( "Procedimento não cadastrado!", HttpStatus.NOT_FOUND);
            }

        } catch (Exception e) {
            log.error("Erro ao excluir procedimento de ID {}.", id, e);

            return new ResponseEntity<>( "Ocorreu um erro inesperado!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation( summary = "Recuperar Procedimentos.", description = "Retorna uma coleção de Procedimentos.")
    @GetMapping("/Procedimentos")
    public @ResponseBody Iterable<Procedimento> getAll() {

        log.info("getAll()");

        return procedimentoRepository.findAll();
    }
}
