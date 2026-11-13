package faculdade.ManterReceita.controller;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import faculdade.ManterReceita.dto.ReceitaResumoDTO;
import faculdade.ManterReceita.service.ReceitaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.log4j.Log4j2;

@Tag(name = "receitas-api", description = "API para consultar Receitas.")
@Log4j2
@RequestMapping(path = "/receitas-api")
@RestController
public class ReceitaController {

    @Autowired
    private ReceitaService receitaService;

    @Operation(
        summary = "Consultar Receitas.",
        description = "Retorna receitas, quantidade e total. "
            + "Os filtros são opcionais e o período considera UTC."
    )
    @GetMapping("/Receitas")
    public ResponseEntity<ReceitaResumoDTO> obter(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicio,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFim,

            @RequestParam(required = false)
            Integer profissional,

            @RequestParam(required = false)
            Integer procedimento) {

        log.info(
            "Consultando receitas. Início: {}, fim: {}, "
                + "profissional: {}, procedimento: {}.",
            dataInicio,
            dataFim,
            profissional,
            procedimento
        );

        try {
            ReceitaResumoDTO resultado = receitaService.obter(
                dataInicio,
                dataFim,
                profissional,
                procedimento
            );

            return ResponseEntity.ok(resultado);

        } catch (IllegalArgumentException e) {
            log.warn("Consulta de receitas rejeitada: {}", e.getMessage());

            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        } catch (IllegalStateException e) {
            log.warn("Histórico financeiro inconsistente: {}", e.getMessage());

            return new ResponseEntity<>(HttpStatus.CONFLICT);

        } catch (Exception e) {
            log.error("Erro ao consultar receitas.", e);

            return new ResponseEntity<>(
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}