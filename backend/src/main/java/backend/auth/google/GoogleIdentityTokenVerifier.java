package backend.auth.google;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import backend.auth.dto.GoogleAccountInfo;
import backend.exception.UnauthorizedException;

@Component
public class GoogleIdentityTokenVerifier {
    private final GoogleIdTokenVerifier verifier;

    public GoogleIdentityTokenVerifier(
        @Value("${google.oauth.web-client-id}") String googleWebClientId) {
        this.verifier =
            new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleWebClientId))
                .build();
    }

    public GoogleAccountInfo verify(String idTokenString) {
      try {
        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken != null) {
          Payload payload = idToken.getPayload();
          String providerUserId = payload.getSubject();

          String email = payload.getEmail();
          boolean emailVerified = Boolean.valueOf(payload.getEmailVerified());
          if(!emailVerified) {
              System.out.println("Invalid email.");
              throw new UnauthorizedException("Google email is not verified");
          }

          System.out.println("User ID: " + providerUserId);
          System.out.println("email: " + email);
          return new GoogleAccountInfo(providerUserId, email);
        } else {
          System.out.println("Invalid ID token.");
          throw new UnauthorizedException("Invalid Google identity token");
        }
      } catch (Exception e) {
        throw new UnauthorizedException("Invalid Google identity token");
      }
    }
}
