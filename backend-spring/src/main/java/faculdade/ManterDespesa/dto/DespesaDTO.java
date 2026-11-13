package faculdade.ManterDespesa.dto;

import java.util.Date;

import faculdade.ManterDespesa.model.Despesa;
import faculdade.ManterUsuario.model.Usuario;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record DespesaDTO(
    Integer id,

    @NotNull(message = "A data é obrigatória!")
    Date data,

    String descricao,

    @NotNull(message = "O valor é obrigatório!")
    @PositiveOrZero(message = "O valor não pode ser negativo!")
    Float valor,

    @NotNull(message = "O usuário é obrigatório!")
    Usuario usuario
) {

    public static DespesaDTO from(Despesa despesa) {
        return new DespesaDTO(
            despesa.getId(),
            despesa.getData(),
            despesa.getDescricao(),
            despesa.getValor(),
            despesa.getUsuario()
        );
    }
}
