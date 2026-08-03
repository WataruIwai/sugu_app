package backend.auth.apple;

import io.jsonwebtoken.Jwts;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.interfaces.ECPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppleClientSecretGenerator {
  private static final String APPLE_AUDIENCE = "https://appleid.apple.com";

  private final String privateKeyPath;
  private final String keyId;
  private final String teamId;
  private final String clientId;

  public AppleClientSecretGenerator(
      @Value("${apple.signin.private-key-path}") String privateKeyPath,
      @Value("${apple.signin.key-id}") String keyId,
      @Value("${apple.signin.team-id}") String teamId,
      @Value("${apple.signin.client-id}") String clientId) {
    this.privateKeyPath = privateKeyPath;
    this.keyId = keyId;
    this.teamId = teamId;
    this.clientId = clientId;
  }

  public String generate() {
    Instant now = Instant.now();
    Instant expiresAt = now.plusSeconds(60 * 60);

    return Jwts.builder()
        .header()
        .keyId(keyId)
        .and()
        .issuer(teamId)
        .subject(clientId)
        .audience()
        .add(APPLE_AUDIENCE)
        .and()
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(readPrivateKey(), Jwts.SIG.ES256)
        .compact();
  }

  private ECPrivateKey readPrivateKey() {
    try {
      String privateKeyPem = Files.readString(Path.of(privateKeyPath));
      String privateKeyContent =
          privateKeyPem
              .replace("-----BEGIN PRIVATE KEY-----", "")
              .replace("-----END PRIVATE KEY-----", "")
              .replaceAll("\\s", "");

      byte[] decodedKey = Base64.getDecoder().decode(privateKeyContent);
      PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decodedKey);
      PrivateKey privateKey = KeyFactory.getInstance("EC").generatePrivate(keySpec);

      if (!(privateKey instanceof ECPrivateKey ecPrivateKey)) {
        throw new IllegalStateException("Apple private key must be an EC private key");
      }

      return ecPrivateKey;
    } catch (Exception e) {
      throw new IllegalStateException("Failed to read Apple Sign in private key", e);
    }
  }
}
