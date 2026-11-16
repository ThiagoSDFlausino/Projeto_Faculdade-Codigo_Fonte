package faculdade.ManterFluxoCaixa.controller;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import faculdade.ManterFluxoCaixa.dto.FluxoDTO;
import faculdade.ManterFluxoCaixa.service.FluxoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.log4j.Log4j2;

@Tag(name = "fluxo-caixa-api", description = "API para consultar Fluxo de Caixa.")
@Log4j2
@RequestMapping(path = "/fluxo-caixa-api")
@RestController
public class FluxoController {

    @Autowired
    private FluxoService fluxoService;

    @Operation(
        summary = "Consultar Fluxo de Caixa.",
        description = "Retorna entradas, valores a receber, saídas e totais. "
            + "O período considera UTC."
    )
    @GetMapping("/FluxoCaixa")
    public ResponseEntity<FluxoDTO> obter(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicio,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFim) {

        log.info(
            "Consultando fluxo de caixa. Início: {}, fim: {}.",
            dataInicio,
            dataFim
        );

        try {
            FluxoDTO resultado = fluxoService.obter(dataInicio, dataFim);

            return ResponseEntity.ok(resultado);

        } catch (IllegalArgumentException e) {
            log.warn("Consulta rejeitada: {}", e.getMessage());

            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        } catch (IllegalStateException e) {
            log.warn("Dados financeiros inconsistentes: {}", e.getMessage());

            return new ResponseEntity<>(HttpStatus.CONFLICT);

        } catch (Exception e) {
            log.error("Erro ao consultar fluxo de caixa.", e);

            return new ResponseEntity<>(
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
