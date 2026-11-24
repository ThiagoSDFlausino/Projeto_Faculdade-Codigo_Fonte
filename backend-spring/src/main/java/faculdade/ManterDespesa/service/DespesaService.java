/**
 * Camada de serviço de despesas. Concentra as regras de negócio relacionadas a despesas.
 */
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

    /**
     * Recupera todas as despesas cadastradas no banco de dados.
     *
     * @return lista contendo todas as despesas encontradas.
     */
    public Iterable<Despesa> getAll() {
        return despesaRepository.findAll();
    }

    /**
     * Cria uma nova despesa com os dados fornecidos.
     *
     * @param despesa objeto contendo os dados da despesa a ser criada.
     * @return objeto criado.
     */
    public Despesa save(Despesa despesa) {
        return despesaRepository.save(despesa);
    }

    /**
     * Recupera uma despesa específica com o ID fornecido.
     *
     * @param id ID da despesa a ser recuperada.
     * @return objeto contendo os dados da despesa encontrada.
     */
    public Optional<Despesa> findById(Integer id) {
        return despesaRepository.findById(id);
    }

    /**
     * Exclui uma despesa existente com o ID fornecido.
     *
     * @param id ID da despesa a ser excluída.
     */
    public void deleteById(Integer id) {
        despesaRepository.deleteById(id);
    }
}
