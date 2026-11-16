package faculdade.ManterFluxoCaixa.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterDespesa.model.Despesa;
import faculdade.ManterDespesa.model.DespesaRepository;
import faculdade.ManterFluxoCaixa.dto.FluxoDTO;
import faculdade.ManterFluxoCaixa.dto.FluxoItemDTO;
import faculdade.ManterFluxoCaixa.model.FluxoRepository;
import faculdade.ManterFluxoCaixa.model.OrigemFluxo;
import faculdade.ManterReceita.dto.ReceitaDTO;
import faculdade.ManterReceita.dto.ReceitaResumoDTO;
import faculdade.ManterReceita.service.ReceitaService;

@Service
public class FluxoService {

    @Autowired
    private ReceitaService receitaService;

    @Autowired
    private DespesaRepository despesaRepository;

    @Autowired
    private FluxoRepository fluxoRepository;

    @Transactional(readOnly = true)
    public FluxoDTO obter(LocalDate dataInicio, LocalDate dataFim) {

        if (dataInicio != null
                && dataFim != null
                && dataFim.isBefore(dataInicio)) {

            throw new IllegalArgumentException(
                "A data final não pode ser anterior à data inicial!"
            );
        }

        LocalDate limiteInicio = LocalDate.of(1, 1, 1);
        LocalDate limiteFim = LocalDate.of(9999, 12, 31);

        LocalDate inicio = dataInicio == null
            ? limiteInicio
            : dataInicio;

        LocalDate fim = dataFim == null
            ? limiteFim
            : dataFim;

        if (inicio.isBefore(limiteInicio)
                || inicio.isAfter(limiteFim)
                || fim.isBefore(limiteInicio)
                || fim.isAfter(limiteFim)) {

            throw new IllegalArgumentException(
                "Informe datas entre os anos 1 e 9999!"
            );
        }

        Date inicioConsulta = Date.from(
            inicio.atStartOfDay(ZoneOffset.UTC).toInstant()
        );

        Date fimConsulta = Date.from(
            fim.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
        );

        ReceitaResumoDTO resumoReceitas = receitaService.obter(
            dataInicio,
            dataFim,
            null,
            null
        );

        List<Agenda> confirmadas = fluxoRepository.findAgendasNoPeriodo(
            StatusAgenda.CONFIRMADO,
            inicioConsulta,
            fimConsulta
        );

        List<Despesa> despesas = despesaRepository.findDespesasNoPeriodo(
            inicioConsulta,
            fimConsulta
        );

        List<FluxoItemDTO> entradas = new ArrayList<>();
        List<FluxoItemDTO> aReceber = new ArrayList<>();
        List<FluxoItemDTO> saidas = new ArrayList<>();

        double totalEntradas = 0;
        double totalAReceber = 0;
        double totalSaidas = 0;

        for (ReceitaDTO receita : resumoReceitas.receitas()) {

            Float valor = receita.valorCobrado();

            if (valor == null || !Float.isFinite(valor) || valor < 0) {
                throw new IllegalStateException(
                    "A agenda " + receita.agenda()
                        + " possui receita inválida!"
                );
            }

            String procedimento = receita.nomeProcedimento() == null
                ? "Procedimento"
                : receita.nomeProcedimento();

            String cliente = receita.nomeCliente() == null
                ? ""
                : receita.nomeCliente();

            entradas.add(new FluxoItemDTO(
                receita.agenda(),
                receita.dataConclusao(),
                procedimento + (cliente.isBlank() ? "" : " - " + cliente),
                valor,
                OrigemFluxo.AGENDA,
                StatusAgenda.CONCLUIDO,
                receita.nomeProfissional(),
                null
            ));

            totalEntradas += valor.doubleValue();
        }

        for (Agenda agenda : confirmadas) {

            if (agenda.getProcedimento() == null) {
                throw new IllegalStateException(
                    "A agenda " + agenda.getId()
                        + " não possui procedimento!"
                );
            }

            Float valor = agenda.getProcedimento().getPreco();

            if (valor == null || !Float.isFinite(valor) || valor < 0) {
                throw new IllegalStateException(
                    "O procedimento da agenda " + agenda.getId()
                        + " possui preço inválido!"
                );
            }

            String procedimento = agenda.getProcedimento().getNome() == null
                ? "Procedimento"
                : agenda.getProcedimento().getNome();

            String cliente = agenda.getCliente() == null
                    || agenda.getCliente().getNome() == null
                ? ""
                : agenda.getCliente().getNome();

            String profissional = agenda.getProfissional() == null
                ? null
                : agenda.getProfissional().getNome();

            aReceber.add(new FluxoItemDTO(
                agenda.getId(),
                agenda.getDataHoraInicio(),
                procedimento + (cliente.isBlank() ? "" : " - " + cliente),
                valor,
                OrigemFluxo.AGENDA,
                StatusAgenda.CONFIRMADO,
                profissional,
                null
            ));

            totalAReceber += valor.doubleValue();
        }

        for (Despesa despesa : despesas) {

            Float valor = despesa.getValor();

            if (valor == null || !Float.isFinite(valor) || valor < 0) {
                throw new IllegalStateException(
                    "A despesa " + despesa.getId()
                        + " possui valor inválido!"
                );
            }

            String usuario = despesa.getUsuario() == null
                ? null
                : despesa.getUsuario().getNome();

            saidas.add(new FluxoItemDTO(
                despesa.getId(),
                despesa.getData(),
                despesa.getDescricao(),
                valor,
                OrigemFluxo.DESPESA,
                null,
                null,
                usuario
            ));

            totalSaidas += valor.doubleValue();
        }

        double saldo = totalEntradas - totalSaidas;

        if (!Float.isFinite((float) totalEntradas)
                || !Float.isFinite((float) totalAReceber)
                || !Float.isFinite((float) totalSaidas)
                || !Float.isFinite((float) saldo)) {

            throw new IllegalStateException(
                "Os totais ultrapassaram o limite numérico suportado!"
            );
        }

        return new FluxoDTO(
            entradas,
            aReceber,
            saidas,
            (float) totalEntradas,
            (float) totalAReceber,
            (float) totalSaidas,
            (float) saldo
        );
    }
}
