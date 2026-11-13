package faculdade.ManterAgenda.service;

import java.util.Date;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import faculdade.ManterAgenda.exception.AgendaConflitoException;
import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;
import faculdade.ManterAgenda.model.StatusAgenda;
import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterClientes.model.ClienteRepository;
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

    public Iterable<Agenda> getAll() {
        return agendaRepository.findAll();
    }

    @Transactional
    public Agenda save(Agenda agenda) {

        if (agenda == null) {
            throw new IllegalArgumentException(
                "A agenda é obrigatória!"
            );
        }

        if (agenda.getStatusAgenda() == null) {
            throw new IllegalArgumentException(
                "O status da agenda é obrigatório!"
            );
        }

        Agenda agendaAnterior = null;

        if (agenda.getId() != null) {
            agendaAnterior = agendaRepository
                .findByIdParaAtualizacao(agenda.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Agenda não cadastrada!"
                ));
        }

        if (agendaAnterior != null
                && agendaAnterior.getStatusAgenda()
                    == StatusAgenda.CONCLUIDO) {

            if (agenda.getStatusAgenda() != StatusAgenda.CONCLUIDO) {
                throw new AgendaConflitoException(
                    "Não é permitido alterar o status "
                        + "de uma agenda já concluída!"
                );
            }

            Float valorHistorico = agendaAnterior.getValorCobrado();

            if (valorHistorico == null
                    || !Float.isFinite(valorHistorico)
                    || valorHistorico < 0
                    || agendaAnterior.getDataConclusao() == null) {

                throw new AgendaConflitoException(
                    "A agenda concluída possui histórico financeiro "
                        + "incompleto ou inválido. Regularize os dados "
                        + "antes de editá-la!"
                );
            }

            if (agenda.getCliente() == null
                    || agenda.getProfissional() == null
                    || agenda.getProcedimento() == null
                    || agendaAnterior.getCliente() == null
                    || agendaAnterior.getProfissional() == null
                    || agendaAnterior.getProcedimento() == null) {

                throw new AgendaConflitoException(
                    "Não é permitido alterar os vínculos "
                        + "de uma agenda concluída!"
                );
            }

            boolean vinculosAlterados =
                !Objects.equals(
                    agendaAnterior.getCliente().getId(),
                    agenda.getCliente().getId()
                )
                || !Objects.equals(
                    agendaAnterior.getProfissional().getId(),
                    agenda.getProfissional().getId()
                )
                || !Objects.equals(
                    agendaAnterior.getProcedimento().getId(),
                    agenda.getProcedimento().getId()
                );

            boolean horariosAlterados =
                !Objects.equals(
                    agendaAnterior.getDataHoraInicio(),
                    agenda.getDataHoraInicio()
                )
                || !Objects.equals(
                    agendaAnterior.getDataHoraFim(),
                    agenda.getDataHoraFim()
                );

            if (vinculosAlterados || horariosAlterados) {
                throw new AgendaConflitoException(
                    "Não é permitido alterar cliente, profissional, "
                        + "procedimento ou horários de uma agenda concluída!"
                );
            }

            // Atualiza somente observações.
            // Valor, data financeira e vínculos vêm do registro original.
            agendaAnterior.setObservacoes(agenda.getObservacoes());

            return agendaRepository.save(agendaAnterior);
        }

        if (agendaAnterior != null
                && (agendaAnterior.getValorCobrado() != null
                    || agendaAnterior.getDataConclusao() != null)) {

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

        boolean procedimentoVinculado =
            profissional.getProcedimentos() != null
                && profissional.getProcedimentos().stream()
                    .filter(Objects::nonNull)
                    .anyMatch(item ->
                        Objects.equals(item.getId(), procedimento.getId())
                    );

        if (!procedimentoVinculado) {
            throw new IllegalArgumentException(
                "O procedimento não está entre os vinculados ao profissional!"
            );
        }

        if (agenda.getStatusAgenda() != StatusAgenda.CANCELADO) {

            Integer agendaIgnorada =
                agenda.getId() == null ? -1 : agenda.getId();

            boolean conflito = agendaRepository.existeConflito(
                profissional.getId(),
                agenda.getDataHoraInicio(),
                agenda.getDataHoraFim(),
                agendaIgnorada,
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
}