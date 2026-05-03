package backend.auth.apple;


import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import backend.auth.dto.JwkKey;
import backend.auth.dto.JwkSet;
import backend.auth.dto.VerifiedAppleUserInfo;
import backend.exception.UnauthorizedException;

import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;

@Component
public class AppleIdentityTokenVerifier {

    //クライアントからidentityTokenを受け取り、その中からkidを取得する
    //kidはKey ID（Key Identifier）でAppleがどの公開鍵を使ったのかの判定するために使用されるkidと合致するものがある。

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

        PublicKey applePublicKey = createRSAKey(matchedKey);
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

    private PublicKey createRSAKey(JwkKey matchedKey ) {
        BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(matchedKey.getN()));
        BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(matchedKey.getE()));

        RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
        try {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PublicKey publicKey = keyFactory.generatePublic(spec);
            return publicKey;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create Apple public key", e);
        }
    }

    //検証メソッド
    private VerifiedAppleUserInfo verify(PublicKey applePublicKey, String identityToken) {
        System.out.println("verify: " + identityToken);
        return new VerifiedAppleUserInfo("1234567890", "test@example.com");
    }
}
