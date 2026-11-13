package faculdade.ManterUsuario.dto;

import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UsuarioDTO(
    Integer id,
    @NotBlank(message = "O nome é obrigatório!") 
    String nome,
    @Email(message = "Email inválido!") 
    @NotBlank(message = "O email é obrigatório!") 
    String email,
    @NotBlank(message = "A senha é obrigatória!")
    String senha,
    String funcao,
    @NotBlank(message = "O perfil é obrigatório!")
    Perfil perfil
) {
    public static UsuarioDTO from(Usuario u) {
        return new UsuarioDTO(
            u.getId(),
            u.getNome(),
            u.getEmail(),
            u.getSenha(),
            u.getFuncao(),
            u.getPerfil());
    }
}