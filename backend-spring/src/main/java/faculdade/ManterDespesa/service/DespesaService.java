package faculdade.ManterDespesa.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import faculdade.ManterDespesa.model.Despesa;
import faculdade.ManterDespesa.model.DespesaRepository;

@Service
public class DespesaService {

    @Autowired
    private DespesaRepository despesaRepository;

    public Iterable<Despesa> getAll() {
        return despesaRepository.findAll();
    }

    public Despesa save(Despesa despesa) {
        return despesaRepository.save(despesa);
    }

    public Optional<Despesa> findById(Integer id) {
        return despesaRepository.findById(id);
    }

    public void deleteById(Integer id) {
        despesaRepository.deleteById(id);
    }
}
