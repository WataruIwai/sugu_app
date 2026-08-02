package backend.auth.apple;

import backend.auth.dto.AppleTokenResponse;
import backend.exception.UnauthorizedException;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class AppleTokenClient {

  private static final String TOKEN_URL =
      "https://appleid.apple.com/auth/token";

  private final RestClient restClient;
  private final AppleClientSecretGenerator clientSecretGenerator;
  private final String clientId;

  public AppleTokenClient(
      RestClient.Builder restClientBuilder,
      AppleClientSecretGenerator clientSecretGenerator,
      @Value("${apple.signin.client-id}") String clientId
  ) {
    this.restClient = restClientBuilder.build();
    this.clientSecretGenerator = clientSecretGenerator;
    this.clientId = clientId;
  }

  public AppleTokenResponse exchangeCode(
      String code,
      String redirectUri
  ) {
    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();

    form.add("client_id", clientId);
    form.add("client_secret", clientSecretGenerator.generate());
    form.add("code", code);
    form.add("grant_type", "authorization_code");
    form.add("redirect_uri", redirectUri);

    try {
      AppleTokenResponse response =
          restClient.post()
              .uri(TOKEN_URL)
              .contentType(MediaType.APPLICATION_FORM_URLENCODED)
              .body(form)
              .retrieve()
              .body(AppleTokenResponse.class);

      if (response == null || response.idToken() == null) {
        throw new UnauthorizedException(
            "Apple token response is invalid"
        );
      }

      return response;
    } catch (Exception e) {
      throw new UnauthorizedException(
          "Failed to exchange Apple authorization code"
      );
    }
  }
}
