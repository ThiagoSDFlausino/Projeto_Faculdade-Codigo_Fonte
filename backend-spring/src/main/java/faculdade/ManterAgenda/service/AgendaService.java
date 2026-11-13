package faculdade.ManterAgenda.service;

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

        if (profissional.getProcedimento() == null
                || !Objects.equals(
                    profissional.getProcedimento().getId(),
                    procedimento.getId()
                )) {

            throw new IllegalArgumentException(
                "O procedimento não corresponde ao vinculado "
                    + "ao profissional!"
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

        agenda.setCliente(cliente);
        agenda.setProfissional(profissional);
        agenda.setProcedimento(procedimento);

        return agendaRepository.save(agenda);
    }

    public Optional<Agenda> findById(Integer id) {
        return agendaRepository.findById(id);
    }

    public void deleteById(Integer id) {
        agendaRepository.deleteById(id);
    }
}
