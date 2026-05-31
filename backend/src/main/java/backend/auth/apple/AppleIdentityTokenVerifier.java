package backend.auth.apple;

import backend.auth.dto.VerifiedAppleUserInfo;
import backend.exception.UnauthorizedException;
import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import java.security.interfaces.RSAPublicKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppleIdentityTokenVerifier {
  private static final String APPLE_ISSUER = "https://appleid.apple.com";
  private final String iosBundleId;
  private final JwkProvider jwkProvider;

  public AppleIdentityTokenVerifier(
      @Value("${apple.signin.audience}") String iosBundleId, JwkProvider jwkProvider) {
    this.iosBundleId = iosBundleId;
    this.jwkProvider = jwkProvider;
  }

  public VerifiedAppleUserInfo execute(String identityToken, String expectedNonceHash) {
    try {
      DecodedJWT decodedJWT = JWT.decode(identityToken);
      String kid = decodedJWT.getKeyId();
      Jwk jwk = jwkProvider.get(kid);
      RSAPublicKey applePublicKey = (RSAPublicKey) jwk.getPublicKey();
      return verify(applePublicKey, identityToken, expectedNonceHash);

      // Jwk.getPublicKey() はInvalidPublicKeyExceptionをthrowsするけどこのハンドリングは適切か？
    } catch (Exception e) {
      throw new UnauthorizedException("Invalid Apple identity token");
    }
  }

  private VerifiedAppleUserInfo verify(
      RSAPublicKey applePublicKey, String identityToken, String expectedNonceHash) {
    try {
      Algorithm algorithm = Algorithm.RSA256(applePublicKey, null);

      JWTVerifier verifier =
          JWT.require(algorithm)
              .withIssuer(APPLE_ISSUER)
              .withAudience(iosBundleId)
              .withClaim("nonce", expectedNonceHash)
              .build();

      DecodedJWT verifiedJwt = verifier.verify(identityToken);
      return new VerifiedAppleUserInfo(
          verifiedJwt.getClaim("sub").asString(), verifiedJwt.getClaim("email").asString());
    } catch (Exception e) {
      throw new UnauthorizedException("Invalid Apple identity token");
    }
  }
}
