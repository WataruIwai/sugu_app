package backend.auth.apple;


import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import backend.auth.dto.JwkKey;
import backend.auth.dto.JwkSet;
import backend.auth.dto.VerifiedAppleUserInfo;
import backend.exception.UnauthorizedException;

import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;

@Component
public class AppleIdentityTokenVerifier {
    private static final String APPLE_ISSUER = "https://appleid.apple.com";
    private final String iosBundleId;

    public AppleIdentityTokenVerifier(
        @Value("${apple.signin.audience}") String iosBundleId
    ) {
        this.iosBundleId = iosBundleId;
    }

    public VerifiedAppleUserInfo execute(String identityToken) {
        DecodedJWT decodedJWT = JWT.decode(identityToken);
        String kid = decodedJWT.getKeyId();

        JwkSet jwkSet = fetchApplePublicKeys();

        JwkKey matchedKey = null;

        for (JwkKey key : jwkSet.getKeys()) {
            if (kid.equals(key.getKid())) {
                matchedKey = key;
                break;
            }
        }

        if (matchedKey == null) {
            throw new UnauthorizedException("Apple key not found");
        }

        RSAPublicKey applePublicKey = createRSAKey(matchedKey);
        return verify(applePublicKey, identityToken);
    }


    //公開キーの元なる材料を取得する。公開キーそのものではない。
    private JwkSet fetchApplePublicKeys() {
        RestClient client = RestClient.create();

        return client.get()
            .uri("https://appleid.apple.com/auth/keys")
            .retrieve()
            .body(JwkSet.class);
    }

    private RSAPublicKey createRSAKey(JwkKey matchedKey ) {
        BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(matchedKey.getN()));
        BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(matchedKey.getE()));

        RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
        try {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return (RSAPublicKey) keyFactory.generatePublic(spec);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create Apple public key", e);
        }
    }

    private VerifiedAppleUserInfo verify(RSAPublicKey applePublicKey, String identityToken) {
        try {
            Algorithm algorithm = Algorithm.RSA256(applePublicKey, null);

            JWTVerifier verifier = JWT.require(algorithm)
                .withIssuer(APPLE_ISSUER)
                .withAudience(iosBundleId)
                .build();

            DecodedJWT verifiedJwt = verifier.verify(identityToken);
            return new VerifiedAppleUserInfo(
                verifiedJwt.getClaim("sub").asString(),
                verifiedJwt.getClaim("email").asString()
            );
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid Apple identity token");
        }
    }
}
