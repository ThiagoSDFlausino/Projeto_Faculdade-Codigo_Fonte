/**
 * Controller REST de usuários. Expõe os endpoints de autenticação e/ou gerenciamento de usuários por meio de requisições HTTP.
 */
package faculdade.ManterUsuario.controller;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterProcedimento.model.ProcedimentoRepository;
import faculdade.ManterUsuario.dto.LoginDTO;
import faculdade.ManterUsuario.dto.LoginRespostaDTO;
import faculdade.ManterUsuario.dto.UsuarioAutenticadoDTO;
import faculdade.ManterUsuario.dto.UsuarioDTO;
import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.log4j.Log4j2;

@Tag(name = "usuarios-api", description = "API de Usuários e autenticação.")
@Log4j2
@RestController
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ProcedimentoRepository procedimentoRepository;

    @Operation(summary = "Autenticar usuário.")
    @PostMapping("/auth/login")
    public ResponseEntity<LoginRespostaDTO> login(
            @Valid @RequestBody LoginDTO loginDTO) {

        try {
            return ResponseEntity.ok(
                usuarioService.login(loginDTO)
            );

        } catch (BadCredentialsException e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        } catch (Exception e) {
            log.error("Erro ao autenticar usuário.", e);

            return new ResponseEntity<>(
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    /**
     * Consulta o usuário autenticado.
     *
     * @param jwt token de autenticação.
     * @return objeto contendo os dados do usuário autenticado.
     */
    @Operation(summary = "Consultar usuário autenticado.")
    @GetMapping("/auth/me")
    public ResponseEntity<UsuarioAutenticadoDTO> me(
            @AuthenticationPrincipal Jwt jwt) {

        try {
            Integer id = Integer.valueOf(jwt.getSubject());

            return ResponseEntity.ok(
                usuarioService.obterAutenticado(id)
            );

        } catch (BadCredentialsException
                | NumberFormatException e) {

            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        } catch (Exception e) {
            log.error("Erro ao consultar usuário autenticado.", e);

            return new ResponseEntity<>(
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Cria um usuário por parâmetros.
     *
     * @param nome nome do usuário.
     * @param email email do usuário.
     * @param senha senha do usuário.
     * @param funcao função do usuário.
     * @param perfil perfil do usuário.
     * @return objeto contendo o resultado da criação do usuário.
     */
    @Operation(summary = "Criar usuário por parâmetros.")
    @PostMapping("/usuarios-api/Usuarios/param")
    public ResponseEntity<String> createString(
            @RequestParam String nome,
            @RequestParam String email,
            @RequestParam String senha,
            @RequestParam String funcao,
            @RequestParam Perfil perfil) {

        log.info("Criando usuário por parâmetros.");

        try {
            if (perfil == Perfil.PROFISSIONAL) {
                return new ResponseEntity<>(
                    "Utilize o cadastro por JSON e informe os procedimentos!",
                    HttpStatus.BAD_REQUEST
                );
            }

            Usuario usuario = new Usuario(
                nome,
                email,
                usuarioService.codificarSenha(senha),
                funcao,
                perfil,
                new ArrayList<>()
            );

            usuarioService.save(usuario);

            return new ResponseEntity<>(
                "Usuario criado com sucesso!",
                HttpStatus.CREATED
            );

        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                e.getMessage(),
                HttpStatus.BAD_REQUEST
            );

        } catch (Exception e) {
            log.error("Erro ao criar usuário.", e);

            return new ResponseEntity<>(
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Cria um usuário por JSON.
     *
     * @param usuarioDTO objeto contendo os dados do usuário.
     * @return objeto contendo o resultado da criação do usuário.
     */
    @Operation(summary = "Criar usuário por JSON.")
    @PostMapping("/usuarios-api/Usuarios")
    public ResponseEntity<UsuarioAutenticadoDTO> create(
            @Valid @RequestBody UsuarioDTO usuarioDTO) {

        log.info("Criando usuário com perfil {}.", usuarioDTO.perfil());

        try {
            List<Procedimento> procedimentos = new ArrayList<>();

            if (usuarioDTO.perfil() == Perfil.PROFISSIONAL) {

                if (usuarioDTO.procedimentos() == null
                        || usuarioDTO.procedimentos().isEmpty()) {

                    return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                }

                Set<Integer> ids = new HashSet<>();

                for (Procedimento recebido : usuarioDTO.procedimentos()) {

                    if (recebido == null || recebido.getId() == null) {
                        return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                    }

                    Optional<Procedimento> encontrado =
                        procedimentoRepository.findById(recebido.getId());

                    if (encontrado.isEmpty()) {
                        return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                    }

                    if (ids.add(recebido.getId())) {
                        procedimentos.add(encontrado.get());
                    }
                }

            } else if (usuarioDTO.procedimentos() != null
                    && !usuarioDTO.procedimentos().isEmpty()) {

                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            Usuario usuario = new Usuario(
                usuarioDTO.nome(),
                usuarioDTO.email(),
                usuarioService.codificarSenha(usuarioDTO.senha()),
                usuarioDTO.funcao(),
                usuarioDTO.perfil(),
                procedimentos
            );

            Usuario salvo = usuarioService.save(usuario);

            return new ResponseEntity<>(
                UsuarioAutenticadoDTO.from(salvo),
                HttpStatus.CREATED
            );

        } catch (IllegalArgumentException e) {
            log.warn("Cadastro rejeitado: {}", e.getMessage());

            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        } catch (Exception e) {
            log.error("Erro ao criar usuário.", e);

            return new ResponseEntity<>(
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Atualiza um usuário por JSON.
     *
     * @param usuarioDTO objeto contendo os dados do usuário.
     * @param id ID do usuário.
     * @return objeto contendo o resultado da atualização do usuário.
     */
    @Operation(summary = "Atualizar usuário.")
    @PutMapping("/usuarios-api/Usuarios/{id}")
    public ResponseEntity<String> update(
            @Valid @RequestBody UsuarioDTO usuarioDTO,
            @PathVariable Integer id) {

        log.info("Atualizando usuário de ID {}.", id);

        try {
            Optional<Usuario> usuarioData = usuarioService.findById(id);

            if (usuarioData.isEmpty()) {
                return new ResponseEntity<>(
                    "Usuario não cadastrado!",
                    HttpStatus.NOT_FOUND
                );
            }

            List<Procedimento> procedimentos = new ArrayList<>();

            if (usuarioDTO.perfil() == Perfil.PROFISSIONAL) {

                if (usuarioDTO.procedimentos() == null
                        || usuarioDTO.procedimentos().isEmpty()) {

                    return new ResponseEntity<>(
                        "Informe pelo menos um procedimento!",
                        HttpStatus.BAD_REQUEST
                    );
                }

                Set<Integer> ids = new HashSet<>();

                for (Procedimento recebido : usuarioDTO.procedimentos()) {

                    if (recebido == null || recebido.getId() == null) {
                        return new ResponseEntity<>(
                            "Informe o ID de cada procedimento!",
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    Optional<Procedimento> encontrado =
                        procedimentoRepository.findById(recebido.getId());

                    if (encontrado.isEmpty()) {
                        return new ResponseEntity<>(
                            "Procedimento não cadastrado!",
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    if (ids.add(recebido.getId())) {
                        procedimentos.add(encontrado.get());
                    }
                }

            } else if (usuarioDTO.procedimentos() != null
                    && !usuarioDTO.procedimentos().isEmpty()) {

                return new ResponseEntity<>(
                    "ADM e SECRETARIA não possuem procedimentos vinculados!",
                    HttpStatus.BAD_REQUEST
                );
            }

            // Valida a nova senha antes de alterar o usuário.
            String novaSenha = null;

            if (usuarioDTO.senha() != null
                    && !usuarioDTO.senha().isBlank()) {

                novaSenha = usuarioService.codificarSenha(
                    usuarioDTO.senha()
                );
            }

            Usuario usuario = usuarioData.get();

            usuario.setNome(usuarioDTO.nome());
            usuario.setEmail(usuarioDTO.email());
            usuario.setFuncao(usuarioDTO.funcao());
            usuario.setPerfil(usuarioDTO.perfil());
            usuario.setProcedimentos(procedimentos);

            if (novaSenha != null) {
                usuario.setSenha(novaSenha);
            }

            usuarioService.save(usuario);

            return ResponseEntity.ok("Usuario alterado com sucesso!");

        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                e.getMessage(),
                HttpStatus.BAD_REQUEST
            );

        } catch (Exception e) {
            log.error("Erro ao atualizar usuário.", e);

            return new ResponseEntity<>(
                "Ocorreu um erro inesperado!",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Exclui um usuário por ID.
     *
     * @param id ID do usuário.
     * @return objeto contendo o resultado da exclusão do usuário.
     */
    @Operation(summary = "Excluir usuário.")
    @DeleteMapping("/usuarios-api/Usuarios/{id}")
    public ResponseEntity<String> delete(@PathVariable Integer id) {

        try {
            if (usuarioService.findById(id).isEmpty()) {
                return new ResponseEntity<>(
                    "Usuario não cadastrado!",
                    HttpStatus.NOT_FOUND
                );
            }

            usuarioService.deleteById(id);

            return ResponseEntity.ok("Usuario excluído com sucesso!");

        } catch (Exception e) {
            log.error("Erro ao excluir usuário.", e);

            return new ResponseEntity<>(
                "Ocorreu um erro inesperado!",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Lista todos os usuários sem senha.
     *
     * @return objeto contendo a lista de usuários.
     */
    @Operation(summary = "Listar usuários sem senha.")
    @GetMapping("/usuarios-api/Usuarios")
    public ResponseEntity<List<UsuarioAutenticadoDTO>> getAll() {

        try {
            List<UsuarioAutenticadoDTO> usuarios = new ArrayList<>();

            usuarioService.getAll().forEach(usuario ->
                usuarios.add(UsuarioAutenticadoDTO.from(usuario))
            );

            return ResponseEntity.ok(usuarios);

        } catch (Exception e) {
            log.error("Erro ao listar usuários.", e);

            return new ResponseEntity<>(
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
