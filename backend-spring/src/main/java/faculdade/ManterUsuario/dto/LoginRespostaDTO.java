package faculdade.ManterUsuario.dto;

public record LoginRespostaDTO(
    String token,
    UsuarioAutenticadoDTO user
) {
}
