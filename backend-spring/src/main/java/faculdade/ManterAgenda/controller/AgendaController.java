package faculdade.ManterAgenda.controller;

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

import faculdade.ManterAgenda.dto.AgendaDTO;
import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.service.AgendaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import faculdade.ManterAgenda.exception.AgendaConflitoException;
import jakarta.validation.Valid;
import lombok.extern.log4j.Log4j2;

@Tag(name = "agendas-api", description = "API para manter Agendas.")
@Log4j2
@RequestMapping(path = "/agendas-api")
@RestController
public class AgendaController {

    @Autowired
    private AgendaService agendaService;

    @Autowired
    private AgendaRepository agendaRepository;

    @Operation(
        summary = "Criar Agenda com objeto.",
        description = "Retorna o objeto criado."
    )
    @PostMapping(path = "/Agendas")
    public ResponseEntity<AgendaDTO> create(
            @Valid @RequestBody AgendaDTO agendaDTO) {

        log.info("Criando agenda.");

        try {
            Agenda agenda = new Agenda(
                null,
                agendaDTO.dataHoraInicio(),
                agendaDTO.dataHoraFim(),
                agendaDTO.observacoes(),
                agendaDTO.profissional(),
                agendaDTO.cliente(),
                agendaDTO.procedimento(),
                agendaDTO.statusAgenda()
            );

            Agenda agendaSalva = agendaService.save(agenda);

            return new ResponseEntity<>(
                AgendaDTO.from(agendaSalva),
                HttpStatus.CREATED
            );

        } catch (AgendaConflitoException e) {
            log.warn("Cadastro de agenda rejeitado: {}", e.getMessage());

            return new ResponseEntity<>(HttpStatus.CONFLICT);

        } catch (IllegalArgumentException e) {
            log.warn("Cadastro de agenda rejeitado: {}", e.getMessage());

            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        } catch (Exception e) {
            log.error("Erro ao criar agenda.", e);

            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation( summary = "Atualizar Agenda com objeto.", description = "Retorna uma mensagem. O ID deve existir." )
    @PutMapping("/Agendas/{id}")
    public ResponseEntity<String> update( @Valid @RequestBody AgendaDTO agendaDTO, @PathVariable Integer id) {

        log.info("Atualizando agenda de ID {}.", id);

        try {
            Optional<Agenda> agendaData = agendaService.findById(id);

            if (agendaData.isPresent()) {
                Agenda agenda = agendaData.get();

                agenda.setDataHoraInicio(agendaDTO.dataHoraInicio());
                agenda.setDataHoraFim(agendaDTO.dataHoraFim());
                agenda.setObservacoes(agendaDTO.observacoes());
                agenda.setProfissional(agendaDTO.profissional());
                agenda.setCliente(agendaDTO.cliente());
                agenda.setProcedimento(agendaDTO.procedimento());
                agenda.setStatusAgenda(agendaDTO.statusAgenda());

                agendaService.save(agenda);

                return ResponseEntity.ok(
                    "Agenda alterada com sucesso!"
                );

            } else {
                return new ResponseEntity<>(
                    "Agenda não cadastrada!",
                    HttpStatus.NOT_FOUND
                );
            }

        } catch (AgendaConflitoException e) {
            return new ResponseEntity<>(
                e.getMessage(),
                HttpStatus.CONFLICT
            );

        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                e.getMessage(),
                HttpStatus.BAD_REQUEST
            );

        } catch (Exception e) {
            log.error("Erro ao atualizar agenda de ID {}.", id, e);

            return new ResponseEntity<>(
                "Ocorreu um erro inesperado!",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Operation( summary = "Exclui uma Agenda por ID.", description = "Retorna uma mensagem. O ID deve existir." )
    @DeleteMapping("/Agendas/{id}")
    public ResponseEntity<String> delete(@PathVariable Integer id) {

        log.info("Excluindo agenda de ID {}.", id);

        try {
            Optional<Agenda> agendaData = agendaService.findById(id);

            if (agendaData.isPresent()) {
                agendaService.deleteById(id);

                return ResponseEntity.ok(
                    "Agenda excluída com sucesso!"
                );

            } else {
                return new ResponseEntity<>(
                    "Agenda não cadastrada!",
                    HttpStatus.NOT_FOUND
                );
            }

        } catch (Exception e) {
            log.error("Erro ao excluir agenda de ID {}.", id, e);

            return new ResponseEntity<>(
                "Ocorreu um erro inesperado!",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Operation( summary = "Recuperar Agendas.", description = "Retorna uma coleção de Agendas." )
    @GetMapping("/Agendas")
    public @ResponseBody Iterable<Agenda> getAll() {

        log.info("getAll()");

        return agendaRepository.findAll();
    }
}
