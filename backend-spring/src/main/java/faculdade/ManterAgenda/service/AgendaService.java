package faculdade.ManterAgenda.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import faculdade.ManterAgenda.model.Agenda;
import faculdade.ManterAgenda.model.AgendaRepository;

@Service
public class AgendaService {

    @Autowired
    private AgendaRepository agendaRepository;

    public Iterable<Agenda> getAll() {
        return agendaRepository.findAll();
    }

    public Agenda save(Agenda agenda) {
        return agendaRepository.save(agenda);
    }

    public Optional<Agenda> findById(Integer id) {
        return agendaRepository.findById(id);
    }

    public void deleteById(Integer id) {
        agendaRepository.deleteById(id);
    }
}