/**
  * Camada de serviço de usuários. Concentra as regras de negócio relacionadas a contas, autenticação e operações de usuários.
 */
package faculdade.ManterUsuario.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import faculdade.ManterUsuario.dto.LoginDTO;
import faculdade.ManterUsuario.dto.LoginRespostaDTO;
import faculdade.ManterUsuario.dto.UsuarioAutenticadoDTO;
import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterUsuario.model.UsuarioRepository;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Value("${app.jwt.issuer:projeto-faculdade}")
    private String issuer;

    @Value("${app.jwt.expiration-seconds:7200}")
    private long expirationSeconds;

    @Value("${app.auth.allow-legacy-passwords:false}")
    private boolean allowLegacyPasswords;

    public Iterable<Usuario> getAll() {
        return usuarioRepository.findAll();
    }

    public Usuario save(Usuario usuario) {
        return usuarioRepository.save(usuario);
    }

    public Optional<Usuario> findById(Integer id) {
        return usuarioRepository.findById(id);
    }

    public void deleteById(Integer id) {
        usuarioRepository.deleteById(id);
    }

    public String codificarSenha(String senha) {

        if (senha == null || senha.isBlank()) {
            throw new IllegalArgumentException(
                "A senha é obrigatória!"
            );
        }

        if (senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException(
                "A senha não pode ultrapassar 72 bytes em UTF-8!"
            );
        }

        return passwordEncoder.encode(senha);
    }

    @Transactional
    public LoginRespostaDTO login(LoginDTO loginDTO) {

        String email = loginDTO.email()
            .trim()
            .toLowerCase(Locale.ROOT);

        List<Usuario> encontrados =
            usuarioRepository.findUsuariosParaLogin(email);

        if (encontrados.size() != 1) {
            throw new BadCredentialsException(
                "E-mail ou senha inválidos!"
            );
        }

        Usuario usuario = encontrados.get(0);
        String armazenada = usuario.getSenha();

        if (armazenada == null || usuario.getPerfil() == null) {
            throw new BadCredentialsException(
                "E-mail ou senha inválidos!"
            );
        }

        if (loginDTO.password()
                .getBytes(StandardCharsets.UTF_8).length > 72) {

            throw new BadCredentialsException(
                "E-mail ou senha inválidos!"
            );
        }

        boolean bcrypt = armazenada.matches(
            "^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$"
        );

        boolean senhaValida;

        if (bcrypt) {
            senhaValida = passwordEncoder.matches(
                loginDTO.password(),
                armazenada
            );
        } else {
            senhaValida = allowLegacyPasswords
                && MessageDigest.isEqual(
                    loginDTO.password().getBytes(StandardCharsets.UTF_8),
                    armazenada.getBytes(StandardCharsets.UTF_8)
                );
        }

        if (!senhaValida) {
            throw new BadCredentialsException(
                "E-mail ou senha inválidos!"
            );
        }

        if (!bcrypt) {
            usuario.setSenha(codificarSenha(loginDTO.password()));
            usuarioRepository.save(usuario);
        }

        if (expirationSeconds <= 0) {
            throw new IllegalStateException(
                "A validade do token precisa ser positiva!"
            );
        }

        Instant agora = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(issuer)
            .subject(usuario.getId().toString())
            .issuedAt(agora)
            .expiresAt(agora.plusSeconds(expirationSeconds))
            .claim("perfil", List.of(usuario.getPerfil().name()))
            .claim("email", usuario.getEmail())
            .build();

        JwsHeader header = JwsHeader
            .with(MacAlgorithm.HS256)
            .build();

        String token = jwtEncoder.encode(
            JwtEncoderParameters.from(header, claims)
        ).getTokenValue();

        return new LoginRespostaDTO(
            token,
            UsuarioAutenticadoDTO.from(usuario)
        );
    }

    @Transactional(readOnly = true)
    public UsuarioAutenticadoDTO obterAutenticado(Integer id) {

        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new BadCredentialsException(
                "Usuário não encontrado!"
            ));

        return UsuarioAutenticadoDTO.from(usuario);
    }
}
