package faculdade.ManterUsuario.controller;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterProcedimento.model.ProcedimentoRepository;
import faculdade.ManterUsuario.dto.UsuarioDTO;
import faculdade.ManterUsuario.model.Perfil;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;
import faculdade.ManterUsuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.log4j.Log4j2;

@Tag(name = "usuarios-api", description = "API para manter Usuarios.")
@Log4j2
@RequestMapping(path = "/usuarios-api")
@RestController
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProcedimentoRepository procedimentoRepository;

    @Operation(
        summary = "Criar Usuario com parametros.",
        description = "Retorna uma mensagem."
    )
    @PostMapping(path = "/Usuarios/param")
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
                    "Para cadastrar um profissional, utilize o cadastro "
                        + "por JSON e informe os procedimentos!",
                    HttpStatus.BAD_REQUEST
                );
            }

            Usuario usuario = new Usuario(
                nome,
                email,
                senha,
                funcao,
                perfil,
                new ArrayList<>()
            );

            usuarioService.save(usuario);

            return new ResponseEntity<>(
                "Usuario criado com sucesso!",
                HttpStatus.CREATED
            );

        } catch (Exception e) {
            log.error("Erro ao criar usuário por parâmetros.", e);

            return new ResponseEntity<>(
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Operation(
        summary = "Criar Usuario com objeto.",
        description = "Retorna o objeto criado."
    )
    @PostMapping(path = "/Usuarios")
    public ResponseEntity<UsuarioDTO> create(
            @Valid @RequestBody UsuarioDTO usuarioDTO) {

        log.info("Criando usuário com perfil {}.", usuarioDTO.perfil());

        try {
            List<Procedimento> procedimentos = new ArrayList<>();

            if (usuarioDTO.perfil() == Perfil.PROFISSIONAL) {

                if (usuarioDTO.procedimentos() == null
                        || usuarioDTO.procedimentos().isEmpty()) {

                    return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                }

                Set<Integer> idsAdicionados = new HashSet<>();

                for (Procedimento procedimentoRecebido
                        : usuarioDTO.procedimentos()) {

                    if (procedimentoRecebido == null
                            || procedimentoRecebido.getId() == null) {

                        return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                    }

                    Optional<Procedimento> procedimentoData =
                        procedimentoRepository.findById(
                            procedimentoRecebido.getId()
                        );

                    if (procedimentoData.isEmpty()) {
                        return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                    }

                    if (idsAdicionados.add(procedimentoRecebido.getId())) {
                        procedimentos.add(procedimentoData.get());
                    }
                }

            } else if (usuarioDTO.procedimentos() != null
                    && !usuarioDTO.procedimentos().isEmpty()) {

                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            Usuario usuario = new Usuario(
                usuarioDTO.nome(),
                usuarioDTO.email(),
                usuarioDTO.senha(),
                usuarioDTO.funcao(),
                usuarioDTO.perfil(),
                procedimentos
            );

            Usuario usuarioSalvo = usuarioService.save(usuario);

            return new ResponseEntity<>(
                UsuarioDTO.from(usuarioSalvo),
                HttpStatus.CREATED
            );

        } catch (Exception e) {
            log.error("Erro ao criar usuário.", e);

            return new ResponseEntity<>(
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Operation(
        summary = "Atualizar Usuario com objeto.",
        description = "Retorna uma mensagem. O ID deve existir."
    )
    @PutMapping("/Usuarios/{id}")
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
                        "O profissional deve ter pelo menos "
                            + "um procedimento vinculado!",
                        HttpStatus.BAD_REQUEST
                    );
                }

                Set<Integer> idsAdicionados = new HashSet<>();

                for (Procedimento procedimentoRecebido
                        : usuarioDTO.procedimentos()) {

                    if (procedimentoRecebido == null
                            || procedimentoRecebido.getId() == null) {

                        return new ResponseEntity<>(
                            "Informe o ID de cada procedimento cadastrado!",
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    Optional<Procedimento> procedimentoData =
                        procedimentoRepository.findById(
                            procedimentoRecebido.getId()
                        );

                    if (procedimentoData.isEmpty()) {
                        return new ResponseEntity<>(
                            "Procedimento não cadastrado: "
                                + procedimentoRecebido.getId(),
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    if (idsAdicionados.add(procedimentoRecebido.getId())) {
                        procedimentos.add(procedimentoData.get());
                    }
                }

            } else if (usuarioDTO.procedimentos() != null
                    && !usuarioDTO.procedimentos().isEmpty()) {

                return new ResponseEntity<>(
                    "ADM e SECRETARIA não devem ter procedimentos vinculados!",
                    HttpStatus.BAD_REQUEST
                );
            }

            Usuario usuario = usuarioData.get();

            usuario.setNome(usuarioDTO.nome());
            usuario.setEmail(usuarioDTO.email());
            usuario.setSenha(usuarioDTO.senha());
            usuario.setFuncao(usuarioDTO.funcao());
            usuario.setPerfil(usuarioDTO.perfil());
            usuario.setProcedimentos(procedimentos);

            usuarioService.save(usuario);

            return ResponseEntity.ok("Usuario alterado com sucesso!");

        } catch (Exception e) {
            log.error("Erro ao atualizar usuário de ID {}.", id, e);

            return new ResponseEntity<>(
                "Ocorreu um erro inesperado!",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Operation(
        summary = "Exclui um Usuario por ID.",
        description = "Retorna uma mensagem. O ID deve existir."
    )
    @DeleteMapping("/Usuarios/{id}")
    public ResponseEntity<String> delete(@PathVariable Integer id) {

        log.info("Excluindo usuário de ID {}.", id);

        try {
            Optional<Usuario> usuarioData = usuarioService.findById(id);

            if (usuarioData.isPresent()) {
                usuarioService.deleteById(id);

                return ResponseEntity.ok(
                    "Usuario excluído com sucesso!"
                );
            }

            return new ResponseEntity<>(
                "Usuario não cadastrado!",
                HttpStatus.NOT_FOUND
            );

        } catch (Exception e) {
            log.error("Erro ao excluir usuário de ID {}.", id, e);

            return new ResponseEntity<>(
                "Ocorreu um erro inesperado!",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Operation(
        summary = "Recuperar Usuarios.",
        description = "Retorna uma coleção de Usuarios."
    )
    @GetMapping("/Usuarios")
    public @ResponseBody Iterable<Usuario> getAll() {

        log.info("getAll()");

        return usuarioRepository.findAll();
    }
}
