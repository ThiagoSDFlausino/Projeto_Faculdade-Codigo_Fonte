package faculdade.ManterUsuario.dto;

import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterProcedimento.model.Procedimento;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

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
    @NotNull(message = "O perfil é obrigatório!")
    Perfil perfil
    @NotNull(message = "O procedimento é obrigatório!")
    Procedimento procedimento
) {
    public static UsuarioDTO from(Usuario u) {
        return new UsuarioDTO(
            u.getId(),
            u.getNome(),
            u.getEmail(),
            u.getSenha(),
            u.getFuncao(),
            u.getPerfil(),
            u.getProcedimento());
    }
}