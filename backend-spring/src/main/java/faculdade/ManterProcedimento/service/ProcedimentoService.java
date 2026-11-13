package faculdade.ManterProcedimento.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterProcedimento.model.ProcedimentoRepository;

@Service
public class ProcedimentoService {

    @Autowired
    private ProcedimentoRepository procedimentoRepository;

    public Iterable<Procedimento> getAll() {
        return procedimentoRepository.findAll();
    }

    public Procedimento save(Procedimento procedimento) {
        return procedimentoRepository.save(procedimento);
    }

    public Optional<Procedimento> findById(Integer id) {
        return procedimentoRepository.findById(id);
    }

    public void deleteById(Integer id) {
        procedimentoRepository.deleteById(id);
    }
}
