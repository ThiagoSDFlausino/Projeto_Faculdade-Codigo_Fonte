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

        if (agenda.getStatusAgenda() == null) {
            throw new IllegalArgumentException(
                "O status da agenda é obrigatório!"
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

        Agenda agendaAnterior = null;

        if (agenda.getId() != null) {
            agendaAnterior = agendaRepository
                .findByIdParaAtualizacao(agenda.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Agenda não cadastrada!"
                ));
        }

        boolean receitaRegistrada =
            agendaAnterior != null
                && agendaAnterior.getValorCobrado() != null
                && agendaAnterior.getDataConclusao() != null;

        if (receitaRegistrada) {

            if (agenda.getStatusAgenda()
                    != agendaAnterior.getStatusAgenda()) {

                throw new AgendaConflitoException(
                    "Não é permitido alterar o status "
                        + "após o registro da receita!"
                );
            }

            if (!Objects.equals(
                    agendaAnterior.getProfissional().getId(),
                    profissional.getId())
                    || !Objects.equals(
                        agendaAnterior.getProcedimento().getId(),
                        procedimento.getId())
                    || !Objects.equals(
                        agendaAnterior.getCliente().getId(),
                        cliente.getId())) {

                throw new AgendaConflitoException(
                    "Não é permitido trocar cliente, profissional "
                        + "ou procedimento de uma agenda com receita!"
                );
            }
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

        if (receitaRegistrada) {

            agenda.setValorCobrado(agendaAnterior.getValorCobrado());
            agenda.setDataConclusao(agendaAnterior.getDataConclusao());

        } else if (agenda.getStatusAgenda() == StatusAgenda.CONCLUIDO) {

            // Evita inventar o histórico de agendas antigas já concluídas.
            if (agendaAnterior != null
                    && agendaAnterior.getStatusAgenda()
                        == StatusAgenda.CONCLUIDO) {

                throw new AgendaConflitoException(
                    "Esta agenda já estava concluída e não possui "
                        + "histórico financeiro completo. "
                        + "Regularize o valor e a data de conclusão "
                        + "antes de editá-la!"
                );
            }

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
