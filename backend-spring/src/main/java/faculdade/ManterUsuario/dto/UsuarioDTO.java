package faculdade.ManterUsuario.dto;

import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterProcedimento.model.Procedimento;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

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
    Perfil perfil,
    List<Procedimento> procedimentos
) {
    public static UsuarioDTO from(Usuario usuario) {
        return new UsuarioDTO(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getSenha(),
            usuario.getFuncao(),
            usuario.getPerfil(),
            usuario.getProcedimentos());
    }
}