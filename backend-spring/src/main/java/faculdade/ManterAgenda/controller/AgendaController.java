package faculdade.ManterAgenda.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import faculdade.ManterAgenda.dto.AgendaDTO;
import faculdade.ManterAgenda.dto.FechamentoDTO;
import faculdade.ManterAgenda.dto.FluxoDTO;
import faculdade.ManterAgenda.dto.ReceitaResumoDTO;
import faculdade.ManterAgenda.exception.AgendaConflitoException;
import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.service.AgendaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

    @Operation(summary = "Criar Agenda com objeto.")
    @PostMapping("/Agendas")
    public ResponseEntity<AgendaDTO> create(
            @Valid @RequestBody AgendaDTO agendaDTO) {

        log.info("Criando agenda.");

        try {
            Agenda agenda = new Agenda(
                null,
                agendaDTO.dataHoraInicio(),
                agendaDTO.dataHoraFim(),
                null,
                null,
                agendaDTO.observacoes(),
                agendaDTO.profissional(),
                agendaDTO.cliente(),
                agendaDTO.procedimento(),
                agendaDTO.statusAgenda()
            );

            return new ResponseEntity<>(
                AgendaDTO.from(agendaService.save(agenda)),
                HttpStatus.CREATED
            );

        } catch (AgendaConflitoException e) {
            log.warn("Cadastro rejeitado: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.CONFLICT);

        } catch (IllegalArgumentException e) {
            log.warn("Cadastro rejeitado: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        } catch (Exception e) {
            log.error("Erro ao criar agenda.", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Atualizar Agenda.")
    @PutMapping("/Agendas/{id}")
    public ResponseEntity<String> update(
            @Valid @RequestBody AgendaDTO agendaDTO,
            @PathVariable Integer id) {

        log.info("Atualizando agenda de ID {}.", id);

        try {
            Optional<Agenda> anterior = agendaService.findById(id);

            if (anterior.isEmpty()) {
                return new ResponseEntity<>(
                    "Agenda não cadastrada!",
                    HttpStatus.NOT_FOUND
                );
            }

            Agenda agenda = new Agenda(
                id,
                agendaDTO.dataHoraInicio(),
                agendaDTO.dataHoraFim(),
                null,
                null,
                agendaDTO.observacoes(),
                agendaDTO.profissional(),
                agendaDTO.cliente(),
                agendaDTO.procedimento(),
                agendaDTO.statusAgenda()
            );

            agendaService.save(agenda);

            return ResponseEntity.ok("Agenda alterada com sucesso!");

        } catch (AgendaConflitoException e) {
            return new ResponseEntity<>(
                e.getMessage(), HttpStatus.CONFLICT
            );

        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                e.getMessage(), HttpStatus.BAD_REQUEST
            );

        } catch (Exception e) {
            log.error("Erro ao atualizar agenda.", e);
            return new ResponseEntity<>(
                "Ocorreu um erro inesperado!",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Operation(summary = "Excluir Agenda.")
    @DeleteMapping("/Agendas/{id}")
    public ResponseEntity<String> delete(@PathVariable Integer id) {

        try {
            if (agendaService.findById(id).isEmpty()) {
                return new ResponseEntity<>(
                    "Agenda não cadastrada!",
                    HttpStatus.NOT_FOUND
                );
            }

            agendaService.deleteById(id);
            return ResponseEntity.ok("Agenda excluída com sucesso!");

        } catch (AgendaConflitoException e) {
            return new ResponseEntity<>(
                e.getMessage(), HttpStatus.CONFLICT
            );

        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                e.getMessage(), HttpStatus.BAD_REQUEST
            );

        } catch (Exception e) {
            log.error("Erro ao excluir agenda.", e);
            return new ResponseEntity<>(
                "Ocorreu um erro inesperado!",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Operation(summary = "Listar Agendas.")
    @GetMapping("/Agendas")
    public @ResponseBody Iterable<Agenda> getAll() {
        return agendaRepository.findAll();
    }

    @Operation(summary = "Consultar Receitas.")
    @GetMapping("/Receitas")
    public ResponseEntity<ReceitaResumoDTO> obterReceitas(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicio,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFim,

            @RequestParam(required = false) Integer profissional,
            @RequestParam(required = false) Integer procedimento) {

        try {
            return ResponseEntity.ok(
                agendaService.obterReceitas(
                    dataInicio, dataFim, profissional, procedimento
                )
            );

        } catch (IllegalArgumentException e) {
            log.warn("Consulta rejeitada: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        } catch (IllegalStateException e) {
            log.warn("Histórico inconsistente: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.CONFLICT);

        } catch (Exception e) {
            log.error("Erro ao consultar receitas.", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Consultar Fluxo de Caixa.")
    @GetMapping("/FluxoCaixa")
    public ResponseEntity<FluxoDTO> obterFluxoCaixa(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicio,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFim) {

        try {
            return ResponseEntity.ok(
                agendaService.obterFluxoCaixa(dataInicio, dataFim)
            );

        } catch (IllegalArgumentException e) {
            log.warn("Consulta rejeitada: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        } catch (IllegalStateException e) {
            log.warn("Histórico inconsistente: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.CONFLICT);

        } catch (Exception e) {
            log.error("Erro ao consultar fluxo.", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(
        summary = "Consultar prévia de fechamento financeiro.",
        description = "Somente ADM. Consulta sem persistência. Período em UTC."
    )
    @GetMapping("/Fechamento")
    public ResponseEntity<FechamentoDTO> obterFechamento(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate periodoInicio,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate periodoFim,

            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        List<String> perfis = jwt.getClaimAsStringList("perfil");

        if (perfis == null || !perfis.contains("ADM")) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        log.info(
            "Consultando fechamento: {} até {}.",
            periodoInicio,
            periodoFim
        );

        try {
            return ResponseEntity.ok(
                agendaService.obterFechamento(periodoInicio, periodoFim)
            );

        } catch (IllegalArgumentException e) {
            log.warn("Consulta rejeitada: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        } catch (IllegalStateException e) {
            log.warn("Histórico inconsistente: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.CONFLICT);

        } catch (Exception e) {
            log.error("Erro ao consultar fechamento.", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
