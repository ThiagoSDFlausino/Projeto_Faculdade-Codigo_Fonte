/**
 * Camada de serviço de procedimentos. Concentra as regras de negócio relacionadas a procedimentos.
 */
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

    /**
     * Recupera todos os procedimentos cadastrados no banco de dados.
     *
     * @return lista contendo todos os procedimentos encontrados.
     */
    public Iterable<Procedimento> getAll() {
        return procedimentoRepository.findAll();
    }

    /**
     * Cria um novo procedimento com os dados fornecidos.
     *
     * @param procedimento objeto contendo os dados do procedimento a ser criado.
     * @return objeto criado.
     */
    public Procedimento save(Procedimento procedimento) {
        return procedimentoRepository.save(procedimento);
    }

    /**
     * Recupera um procedimento específico com o ID fornecido.
     *
     * @param id ID do procedimento a ser recuperado.
     * @return objeto contendo os dados do procedimento encontrado.
     */
    public Optional<Procedimento> findById(Integer id) {
        return procedimentoRepository.findById(id);
    }

    /**
     * Exclui um procedimento existente com o ID fornecido.
     *
     * @param id ID do procedimento a ser excluído.
     */
    public void deleteById(Integer id) {
        procedimentoRepository.deleteById(id);
    }
}
