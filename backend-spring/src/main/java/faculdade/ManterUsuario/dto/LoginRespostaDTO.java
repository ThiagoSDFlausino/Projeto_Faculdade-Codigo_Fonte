/**
 * DTO utilizado no fluxo de login, para transportar os dados de autenticação entre cliente e API.
 */
package faculdade.ManterUsuario.dto;

public record LoginRespostaDTO(
    String token,
    UsuarioAutenticadoDTO user
) {
}
