/**
 * DTO utilizado no fluxo de login, para transportar os dados de autenticação entre cliente e API.
 */
package faculdade.ManterUsuario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginDTO(
    @NotBlank(message = "O email é obrigatório!")
    @Email(message = "Email inválido!")
    String email,

    @NotBlank(message = "A senha é obrigatória!")
    String password
) {
}
