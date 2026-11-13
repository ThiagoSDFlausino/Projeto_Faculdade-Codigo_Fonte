package faculdade.ManterProcedimento.dto;

import faculdade.ManterProcedimento.model.CategoriaProcedimento;
import faculdade.ManterProcedimento.model.Procedimento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ProcedimentoDTO(
    Integer id,

    @NotBlank(message = "O nome do procedimento é obrigatório!")
    String nome,

    String descricao,

    @NotNull(message = "A duração é obrigatória!")
    @PositiveOrZero(message = "A duração não pode ser negativa!")
    Integer duracao,

    @NotNull(message = "O preço é obrigatório!")
    @PositiveOrZero(message = "O preço não pode ser negativo!")
    Float preco,

    @NotNull(message = "Informe se o procedimento está ativo!")
    Boolean ativo,

    @NotNull(message = "A categoria do procedimento é obrigatória!")
    CategoriaProcedimento categoriaProcedimento
) {

    public static ProcedimentoDTO from(Procedimento procedimento) {
        return new ProcedimentoDTO(
            procedimento.getId(),
            procedimento.getNome(),
            procedimento.getDescricao(),
            procedimento.getDuracao(),
            procedimento.getPreco(),
            procedimento.getAtivo(),
            procedimento.getCategoriaProcedimento()
        );
    }
}
