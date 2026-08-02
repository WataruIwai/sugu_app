package backend.auth.apple;

import backend.auth.dto.VerifiedAppleUserInfo;
import backend.exception.UnauthorizedException;
import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.auth0.jwt.interfaces.Verification;
import java.security.interfaces.RSAPublicKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppleIdentityTokenVerifier {
  private static final String APPLE_ISSUER = "https://appleid.apple.com";
  private final String iosBundleId;
  private final String webClientId;
  private final JwkProvider jwkProvider;

  public AppleIdentityTokenVerifier(
      @Value("${apple.signin.audience}") String iosBundleId,
      @Value("${apple.signin.client-id}") String webClientId,
      JwkProvider jwkProvider) {
    this.iosBundleId = iosBundleId;
    this.webClientId = webClientId;
    this.jwkProvider = jwkProvider;
  }

  public VerifiedAppleUserInfo execute(String identityToken, String expectedNonceHash) {
    return execute(identityToken, expectedNonceHash, iosBundleId);
  }

  public VerifiedAppleUserInfo executeForWeb(String identityToken, String expectedNonce) {
    return execute(identityToken, expectedNonce, webClientId);
  }

  private VerifiedAppleUserInfo execute(
      String identityToken, String expectedNonce, String audience) {
    try {
      DecodedJWT decodedJWT = JWT.decode(identityToken);
      String kid = decodedJWT.getKeyId();
      Jwk jwk = jwkProvider.get(kid);
      RSAPublicKey applePublicKey = (RSAPublicKey) jwk.getPublicKey();
      return verify(applePublicKey, identityToken, expectedNonce, audience);

      // Jwk.getPublicKey() はInvalidPublicKeyExceptionをthrowsするけどこのハンドリングは適切か？
    } catch (Exception e) {
      throw new UnauthorizedException("Invalid Apple identity token");
    }
  }

  private VerifiedAppleUserInfo verify(
      RSAPublicKey applePublicKey, String identityToken, String expectedNonce, String audience) {
    try {
      Algorithm algorithm = Algorithm.RSA256(applePublicKey, null);

      Verification verification =
          JWT.require(algorithm).withIssuer(APPLE_ISSUER).withAudience(audience);

      if (expectedNonce != null && !expectedNonce.isBlank()) {
        verification.withClaim("nonce", expectedNonce);
      }

      JWTVerifier verifier = verification.build();

      DecodedJWT verifiedJwt = verifier.verify(identityToken);
      return new VerifiedAppleUserInfo(
          verifiedJwt.getClaim("sub").asString(), verifiedJwt.getClaim("email").asString());
    } catch (Exception e) {
      throw new UnauthorizedException("Invalid Apple identity token");
    }
  }
}
