package faculdade.ManterReceita.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterReceita.dto.ReceitaDTO;
import faculdade.ManterReceita.dto.ReceitaResumoDTO;

@Service
public class ReceitaService {

    @Autowired
    private AgendaRepository agendaRepository;

    @Transactional(readOnly = true)
    public ReceitaResumoDTO obter(
            LocalDate dataInicio,
            LocalDate dataFim,
            Integer profissional,
            Integer procedimento) {

        if (dataInicio != null
                && dataFim != null
                && dataFim.isBefore(dataInicio)) {

            throw new IllegalArgumentException(
                "A data final não pode ser anterior à data inicial!"
            );
        }

        if (profissional != null && profissional <= 0) {
            throw new IllegalArgumentException(
                "O filtro de profissional deve ser um ID positivo!"
            );
        }

        if (procedimento != null && procedimento <= 0) {
            throw new IllegalArgumentException(
                "O filtro de procedimento deve ser um ID positivo!"
            );
        }

        LocalDate inicio = dataInicio == null
            ? LocalDate.of(1, 1, 1)
            : dataInicio;

        LocalDate fim = dataFim == null
            ? LocalDate.of(9999, 12, 31)
            : dataFim;

        if (inicio.isBefore(LocalDate.of(1, 1, 1))
                || inicio.isAfter(LocalDate.of(9999, 12, 31))
                || fim.isBefore(LocalDate.of(1, 1, 1))
                || fim.isAfter(LocalDate.of(9999, 12, 31))) {

            throw new IllegalArgumentException(
                "Informe datas entre os anos 1 e 9999!"
            );
        }

        long receitasSemHistorico =
            agendaRepository.countReceitasSemHistorico(
                StatusAgenda.CONCLUIDO
            );

        if (receitasSemHistorico > 0) {
            throw new IllegalStateException(
                "Existem agendas concluídas sem valor ou data de conclusão. "
                    + "Regularize o histórico financeiro antes da consulta!"
            );
        }

        Date inicioConsulta = Date.from(
            inicio.atStartOfDay(ZoneOffset.UTC).toInstant()
        );

        // Inclui todo o último dia, sem depender de 23:59:59.999.
        Date fimConsulta = Date.from(
            fim.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
        );

        List<Agenda> agendas = agendaRepository.findReceitas(
            StatusAgenda.CONCLUIDO,
            inicioConsulta,
            fimConsulta,
            profissional,
            procedimento
        );

        List<ReceitaDTO> receitas = new ArrayList<>();
        double total = 0;

        for (Agenda agenda : agendas) {
            Float valor = agenda.getValorCobrado();

            if (valor == null || !Float.isFinite(valor) || valor < 0) {
                throw new IllegalStateException(
                    "A agenda " + agenda.getId()
                        + " possui um valor financeiro inválido!"
                );
            }

            receitas.add(ReceitaDTO.from(agenda));
            total += valor.doubleValue();
        }

        float totalReceitas = (float) total;

        if (!Float.isFinite(totalReceitas)) {
            throw new IllegalStateException(
                "O total de receitas ultrapassou o limite numérico suportado!"
            );
        }

        return new ReceitaResumoDTO(
            receitas,
            receitas.size(),
            totalReceitas
        );
    }
}
