package faculdade.ManterAgenda.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import faculdade.ManterAgenda.dto.AgendaDTO;
import faculdade.ManterAgenda.dto.FechamentoDTO;
import faculdade.ManterAgenda.dto.FluxoDTO;
import faculdade.ManterAgenda.dto.ReceitaResumoDTO;
import faculdade.ManterAgenda.exception.AgendaConflitoException;
import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterClientes.model.ClienteRepository;
import faculdade.ManterDespesa.dto.DespesaDTO;
import faculdade.ManterDespesa.model.Despesa;
import faculdade.ManterDespesa.model.DespesaRepository;
import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterProcedimento.model.ProcedimentoRepository;
import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;

@Service
public class AgendaService {

    @Autowired
    private AgendaRepository agendaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProcedimentoRepository procedimentoRepository;

    @Autowired
    private DespesaRepository despesaRepository;

    public Iterable<Agenda> getAll() {
        return agendaRepository.findAll();
    }

    @Transactional
    public Agenda save(Agenda agenda) {

        if (agenda == null) {
            throw new IllegalArgumentException("A agenda é obrigatória!");
        }

        if (agenda.getStatusAgenda() == null) {
            throw new IllegalArgumentException(
                "O status da agenda é obrigatório!"
            );
        }

        Agenda anterior = null;

        if (agenda.getId() != null) {
            anterior = agendaRepository
                .findByIdParaAtualizacao(agenda.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Agenda não cadastrada!"
                ));
        }

        if (anterior != null
                && anterior.getStatusAgenda() == StatusAgenda.CONCLUIDO) {

            if (agenda.getStatusAgenda() != StatusAgenda.CONCLUIDO) {
                throw new AgendaConflitoException(
                    "Não é permitido alterar o status "
                        + "de uma agenda já concluída!"
                );
            }

            Float valorHistorico = anterior.getValorCobrado();

            if (valorHistorico == null
                    || !Float.isFinite(valorHistorico)
                    || valorHistorico < 0
                    || anterior.getDataConclusao() == null) {

                throw new AgendaConflitoException(
                    "A agenda concluída possui histórico financeiro "
                        + "incompleto ou inválido. Regularize os dados "
                        + "antes de editá-la!"
                );
            }

            if (agenda.getCliente() == null
                    || agenda.getProfissional() == null
                    || agenda.getProcedimento() == null
                    || anterior.getCliente() == null
                    || anterior.getProfissional() == null
                    || anterior.getProcedimento() == null) {

                throw new AgendaConflitoException(
                    "Não é permitido alterar os vínculos "
                        + "de uma agenda concluída!"
                );
            }

            boolean vinculosAlterados =
                !Objects.equals(
                    anterior.getCliente().getId(),
                    agenda.getCliente().getId()
                )
                || !Objects.equals(
                    anterior.getProfissional().getId(),
                    agenda.getProfissional().getId()
                )
                || !Objects.equals(
                    anterior.getProcedimento().getId(),
                    agenda.getProcedimento().getId()
                );

            boolean horariosAlterados =
                !Objects.equals(
                    anterior.getDataHoraInicio(),
                    agenda.getDataHoraInicio()
                )
                || !Objects.equals(
                    anterior.getDataHoraFim(),
                    agenda.getDataHoraFim()
                );

            if (vinculosAlterados || horariosAlterados) {
                throw new AgendaConflitoException(
                    "Não é permitido alterar cliente, profissional, "
                        + "procedimento ou horários de uma agenda concluída!"
                );
            }

            anterior.setObservacoes(agenda.getObservacoes());

            return agendaRepository.save(anterior);
        }

        if (anterior != null
                && (anterior.getValorCobrado() != null
                    || anterior.getDataConclusao() != null)) {

            throw new AgendaConflitoException(
                "A agenda possui dados financeiros, mas não está concluída. "
                    + "Regularize o histórico antes de editá-la!"
            );
        }

        if (agenda.getDataHoraInicio() == null
                || agenda.getDataHoraFim() == null) {

            throw new IllegalArgumentException(
                "Informe a data e hora de início e de fim!"
            );
        }

        if (!agenda.getDataHoraFim().after(agenda.getDataHoraInicio())) {
            throw new IllegalArgumentException(
                "O horário final deve ser posterior ao horário inicial!"
            );
        }

        if (agenda.getCliente() == null
                || agenda.getCliente().getId() == null) {

            throw new IllegalArgumentException(
                "Informe um cliente cadastrado!"
            );
        }

        if (agenda.getProfissional() == null
                || agenda.getProfissional().getId() == null) {

            throw new IllegalArgumentException(
                "Informe um profissional cadastrado!"
            );
        }

        if (agenda.getProcedimento() == null
                || agenda.getProcedimento().getId() == null) {

            throw new IllegalArgumentException(
                "Informe um procedimento cadastrado!"
            );
        }

        Cliente cliente = clienteRepository
            .findById(agenda.getCliente().getId())
            .orElseThrow(() -> new IllegalArgumentException(
                "Cliente não cadastrado!"
            ));

        Usuario profissional = usuarioRepository
            .findByIdParaAgendamento(agenda.getProfissional().getId())
            .orElseThrow(() -> new IllegalArgumentException(
                "Profissional não cadastrado!"
            ));

        if (profissional.getPerfil() != Perfil.PROFISSIONAL) {
            throw new IllegalArgumentException(
                "O usuário selecionado não possui perfil PROFISSIONAL!"
            );
        }

        Procedimento procedimento = procedimentoRepository
            .findById(agenda.getProcedimento().getId())
            .orElseThrow(() -> new IllegalArgumentException(
                "Procedimento não cadastrado!"
            ));

        boolean vinculado =
            profissional.getProcedimentos() != null
                && profissional.getProcedimentos().stream()
                    .filter(Objects::nonNull)
                    .anyMatch(item ->
                        Objects.equals(item.getId(), procedimento.getId())
                    );

        if (!vinculado) {
            throw new IllegalArgumentException(
                "O procedimento não está entre os vinculados ao profissional!"
            );
        }

        if (agenda.getStatusAgenda() != StatusAgenda.CANCELADO) {

            Integer ignorada = agenda.getId() == null
                ? -1
                : agenda.getId();

            boolean conflito = agendaRepository.existeConflito(
                profissional.getId(),
                agenda.getDataHoraInicio(),
                agenda.getDataHoraFim(),
                ignorada,
                StatusAgenda.CANCELADO
            );

            if (conflito) {
                throw new AgendaConflitoException(
                    "O profissional já possui um agendamento "
                        + "que ocupa parte ou todo esse intervalo!"
                );
            }
        }

        if (agenda.getStatusAgenda() == StatusAgenda.CONCLUIDO) {

            Float preco = procedimento.getPreco();

            if (preco == null || !Float.isFinite(preco) || preco < 0) {
                throw new IllegalArgumentException(
                    "O procedimento deve possuir um preço válido!"
                );
            }

            agenda.setValorCobrado(preco);
            agenda.setDataConclusao(new Date());

        } else {
            agenda.setValorCobrado(null);
            agenda.setDataConclusao(null);
        }

        agenda.setCliente(cliente);
        agenda.setProfissional(profissional);
        agenda.setProcedimento(procedimento);

        return agendaRepository.save(agenda);
    }

    public Optional<Agenda> findById(Integer id) {
        return agendaRepository.findById(id);
    }

    @Transactional
    public void deleteById(Integer id) {

        Agenda agenda = agendaRepository
            .findByIdParaAtualizacao(id)
            .orElseThrow(() -> new IllegalArgumentException(
                "Agenda não cadastrada!"
            ));

        if (agenda.getStatusAgenda() == StatusAgenda.CONCLUIDO
                || agenda.getValorCobrado() != null
                || agenda.getDataConclusao() != null) {

            throw new AgendaConflitoException(
                "Não é permitido excluir uma agenda "
                    + "concluída ou com receita registrada!"
            );
        }

        agendaRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public ReceitaResumoDTO obterReceitas(
            LocalDate dataInicio,
            LocalDate dataFim,
            Integer profissional,
            Integer procedimento) {

        validarPeriodo(dataInicio, dataFim);

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

        long semHistorico = agendaRepository.countReceitasSemHistorico(
            StatusAgenda.CONCLUIDO
        );

        if (semHistorico > 0) {
            throw new IllegalStateException(
                "Existem agendas concluídas sem valor ou data de conclusão. "
                    + "Regularize o histórico financeiro antes da consulta!"
            );
        }

        List<Agenda> agendas = agendaRepository.findReceitas(
            StatusAgenda.CONCLUIDO,
            inicioDoPeriodo(dataInicio),
            fimExclusivoDoPeriodo(dataFim),
            profissional,
            procedimento
        );

        List<AgendaDTO> receitas = new ArrayList<>();
        double total = 0;

        for (Agenda agenda : agendas) {

            Float valor = agenda.getValorCobrado();

            if (valor == null || !Float.isFinite(valor) || valor < 0) {
                throw new IllegalStateException(
                    "A agenda " + agenda.getId()
                        + " possui um valor financeiro inválido!"
                );
            }

            receitas.add(AgendaDTO.from(agenda));
            total += valor.doubleValue();
        }

        if (!Float.isFinite((float) total)) {
            throw new IllegalStateException(
                "O total de receitas ultrapassou o limite numérico suportado!"
            );
        }

        return new ReceitaResumoDTO(
            receitas,
            receitas.size(),
            (float) total
        );
    }

    @Transactional(readOnly = true)
    public FluxoDTO obterFluxoCaixa(
            LocalDate dataInicio,
            LocalDate dataFim) {

        validarPeriodo(dataInicio, dataFim);

        Date inicio = inicioDoPeriodo(dataInicio);
        Date fim = fimExclusivoDoPeriodo(dataFim);

        ReceitaResumoDTO resumo = obterReceitas(
            dataInicio, dataFim, null, null
        );

        List<Agenda> confirmadas = agendaRepository.findAgendasNoPeriodo(
            StatusAgenda.CONFIRMADO, inicio, fim
        );

        List<Despesa> despesas = despesaRepository.findDespesasNoPeriodo(
            inicio, fim
        );

        List<AgendaDTO> aReceber = new ArrayList<>();
        List<DespesaDTO> saidas = new ArrayList<>();

        double totalEntradas = 0;
        double totalAReceber = 0;
        double totalSaidas = 0;

        for (AgendaDTO receita : resumo.receitas()) {
            totalEntradas += receita.valorCobrado().doubleValue();
        }

        for (Agenda confirmada : confirmadas) {

            if (confirmada.getProcedimento() == null) {
                throw new IllegalStateException(
                    "A agenda " + confirmada.getId()
                        + " não possui procedimento!"
                );
            }

            Float valor = confirmada.getProcedimento().getPreco();

            if (valor == null || !Float.isFinite(valor) || valor < 0) {
                throw new IllegalStateException(
                    "O procedimento da agenda " + confirmada.getId()
                        + " possui preço inválido!"
                );
            }

            aReceber.add(AgendaDTO.from(confirmada));
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

            saidas.add(DespesaDTO.from(despesa));
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
            resumo.receitas(),
            aReceber,
            saidas,
            (float) totalEntradas,
            (float) totalAReceber,
            (float) totalSaidas,
            (float) saldo
        );
    }

    @Transactional(
        readOnly = true,
        isolation = Isolation.REPEATABLE_READ
    )
    public FechamentoDTO obterFechamento(
            LocalDate periodoInicio,
            LocalDate periodoFim) {

        if (periodoInicio == null || periodoFim == null) {
            throw new IllegalArgumentException(
                "Informe o início e o fim do período!"
            );
        }

        validarPeriodo(periodoInicio, periodoFim);

        FluxoDTO fluxo = obterFluxoCaixa(periodoInicio, periodoFim);

        Map<Integer, Usuario> profissionais = new LinkedHashMap<>();
        Map<Integer, Integer> quantidades = new LinkedHashMap<>();
        Map<Integer, Double> faturamentos = new LinkedHashMap<>();

        for (AgendaDTO atendimento : fluxo.entradas()) {

            Usuario profissional = atendimento.profissional();

            if (profissional == null || profissional.getId() == null) {
                throw new IllegalStateException(
                    "A agenda " + atendimento.id()
                        + " não possui profissional válido!"
                );
            }

            Integer id = profissional.getId();

            profissionais.putIfAbsent(id, profissional);
            quantidades.merge(id, 1, Integer::sum);
            faturamentos.merge(
                id,
                atendimento.valorCobrado().doubleValue(),
                Double::sum
            );
        }

        List<FechamentoDTO.ProfissionalResumoDTO> porProfissional =
            new ArrayList<>();

        for (Map.Entry<Integer, Usuario> item
                : profissionais.entrySet()) {

            Integer id = item.getKey();
            Usuario profissional = item.getValue();
            float total = faturamentos.get(id).floatValue();

            if (!Float.isFinite(total)) {
                throw new IllegalStateException(
                    "O faturamento do profissional ultrapassou "
                        + "o limite numérico suportado!"
                );
            }

            porProfissional.add(
                new FechamentoDTO.ProfissionalResumoDTO(
                    id,
                    profissional.getNome(),
                    profissional.getFuncao(),
                    quantidades.get(id),
                    total
                )
            );
        }

        porProfissional.sort((primeiro, segundo) ->
            Float.compare(
                segundo.totalFaturamento(),
                primeiro.totalFaturamento()
            )
        );

        return new FechamentoDTO(
            periodoInicio,
            periodoFim,
            fluxo.totalEntradas(),
            fluxo.totalSaidas(),
            fluxo.saldo(),
            fluxo.totalAReceber(),
            fluxo.entradas().size(),
            porProfissional,
            fluxo.entradas(),
            fluxo.saidas()
        );
    }

    private void validarPeriodo(
            LocalDate dataInicio,
            LocalDate dataFim) {

        if (dataInicio != null && dataFim != null
                && dataFim.isBefore(dataInicio)) {

            throw new IllegalArgumentException(
                "A data final não pode ser anterior à data inicial!"
            );
        }

        LocalDate minimo = LocalDate.of(1, 1, 1);
        LocalDate maximo = LocalDate.of(9999, 12, 31);

        if ((dataInicio != null
                && (dataInicio.isBefore(minimo)
                    || dataInicio.isAfter(maximo)))
                || (dataFim != null
                    && (dataFim.isBefore(minimo)
                        || dataFim.isAfter(maximo)))) {

            throw new IllegalArgumentException(
                "Informe datas entre os anos 1 e 9999!"
            );
        }
    }

    private Date inicioDoPeriodo(LocalDate dataInicio) {
        LocalDate inicio = dataInicio == null
            ? LocalDate.of(1, 1, 1)
            : dataInicio;

        return Date.from(
            inicio.atStartOfDay(ZoneOffset.UTC).toInstant()
        );
    }

    private Date fimExclusivoDoPeriodo(LocalDate dataFim) {
        LocalDate fim = dataFim == null
            ? LocalDate.of(9999, 12, 31)
            : dataFim;

        return Date.from(
            fim.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
        );
    }
}
