package faculdade.ManterUsuario.dto;

import java.util.List;

import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;

public record UsuarioAutenticadoDTO(
    Integer id,
    String name,
    String email,
    String role,
    String funcao,
    List<Integer> procedimento_ids
) {

    public static UsuarioAutenticadoDTO from(Usuario usuario) {

        String role;

        if (usuario.getPerfil() == Perfil.ADM) {
            role = "admin";
        } else if (usuario.getPerfil() == Perfil.SECRETARIA) {
            role = "secretaria";
        } else {
            role = "profissional";
        }

        List<Integer> procedimentos =
            usuario.getProcedimentos() == null
                ? List.of()
                : usuario.getProcedimentos().stream()
                    .map(Procedimento::getId)
                    .toList();

        return new UsuarioAutenticadoDTO(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            role,
            usuario.getFuncao(),
            procedimentos
        );
    }
}
