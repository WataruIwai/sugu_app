package backend.auth.apple;

import backend.auth.dto.AppleTokenResponse;
import backend.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class AppleTokenClient {

  private static final Logger logger = LoggerFactory.getLogger(AppleTokenClient.class);
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
      ResponseEntity<AppleTokenResponse> responseEntity =
          restClient.post()
              .uri(TOKEN_URL)
              .contentType(MediaType.APPLICATION_FORM_URLENCODED)
              .body(form)
              .retrieve()
              .toEntity(AppleTokenResponse.class);

      AppleTokenResponse response = responseEntity.getBody();
      if (response == null || response.idToken() == null) {
        logger.warn(
            "Apple token response is invalid. status={}, tokenType={}, accessTokenPresent={}, refreshTokenPresent={}",
            responseEntity.getStatusCode(),
            response == null ? null : response.tokenType(),
            response != null && response.accessToken() != null,
            response != null && response.refreshToken() != null);
        throw new UnauthorizedException(
            "Apple token response is invalid"
        );
      }

      return response;
    } catch (RestClientResponseException e) {
      logger.warn(
          "Apple token exchange failed. status={}, responseBody={}",
          e.getStatusCode().value(),
          e.getResponseBodyAsString());
      throw new UnauthorizedException(
          "Failed to exchange Apple authorization code"
      );
    } catch (Exception e) {
      logger.warn("Apple token exchange failed before receiving a response", e);
      throw new UnauthorizedException(
          "Failed to exchange Apple authorization code"
      );
    }
  }
}
