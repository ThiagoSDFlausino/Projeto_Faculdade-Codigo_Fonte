package faculdade.ManterUsuario.config;

import java.util.Base64;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Configuration
public class JwtConfig {

    @Bean
    public SecretKey jwtSecretKey(
            @Value("${app.jwt.secret-base64}") String secretBase64) {

        byte[] chave;

        try {
            chave = Base64.getDecoder().decode(secretBase64);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                "A chave JWT deve estar no formato Base64!",
                e
            );
        }

        if (chave.length < 32) {
            throw new IllegalStateException(
                "A chave JWT precisa ter pelo menos 32 bytes!"
            );
        }

        return new SecretKeySpec(chave, "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(
            new ImmutableSecret<>(jwtSecretKey)
        );
    }

    @Bean
    public JwtDecoder jwtDecoder(
            SecretKey jwtSecretKey,
            @Value("${app.jwt.issuer:projeto-faculdade}") String issuer) {

        NimbusJwtDecoder decoder = NimbusJwtDecoder
            .withSecretKey(jwtSecretKey)
            .macAlgorithm(MacAlgorithm.HS256)
            .build();

        decoder.setJwtValidator(
            JwtValidators.createDefaultWithIssuer(issuer)
        );

        return decoder;
    }
}
