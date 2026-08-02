package backend.auth.controller;

import backend.auth.apple.AppleAuthSession;
import backend.auth.apple.AppleAuthSessionStore;
import backend.auth.apple.AppleTokenClient;
import backend.auth.dto.AppleAuthRequest;
import backend.auth.dto.AppleTokenResponse;
import backend.auth.service.AuthService;
import backend.exception.UnauthorizedException;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping({"/api/v1/auth", "/auth"})
public class AuthController {
  private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
  private final AuthService authService;
  private final String appleWebRedirectUri;
  private final String appleWebClientId;
  private final AppleAuthSessionStore appleAuthSessionStore;
  private final AppleTokenClient appleTokenClient;

  public AuthController(
      AuthService authService,
      @Value("${apple.signin.web-redirect-uri}") String appleWebRedirectUri,
      @Value("${apple.signin.client-id}") String appleWebClientId,
      AppleAuthSessionStore appleAuthSessionStore,
      AppleTokenClient appleTokenClient) {
    this.authService = authService;
    this.appleWebRedirectUri = appleWebRedirectUri;
    this.appleWebClientId = appleWebClientId;
    this.appleAuthSessionStore = appleAuthSessionStore;
    this.appleTokenClient = appleTokenClient;
  }

  @PostMapping("/apple")
  public String signInWithAppleAuth(@RequestBody AppleAuthRequest request) {
    logger.info(
        "POST /auth/apple received. identityTokenPresent={}",
        request.getIdentityToken() != null && !request.getIdentityToken().isBlank());
    String token = authService.signInWithAppleAuth(request);
    logger.info("POST /auth/apple succeeded");
    return token;
  }

  @GetMapping("/apple/web/start")
  public ResponseEntity<String> startAppleAuth() {
    String state = UUID.randomUUID().toString();
    String nonce = UUID.randomUUID().toString();

    AppleAuthSession session =
        new AppleAuthSession(nonce, Instant.now().plus(Duration.ofMinutes(10)));

    appleAuthSessionStore.save(state, session);

    URI authorizationUri =
        UriComponentsBuilder
            .fromUriString("https://appleid.apple.com/auth/authorize")
            .queryParam("client_id", appleWebClientId)
            .queryParam("redirect_uri", appleWebRedirectUri)
            .queryParam("response_type", "code")
            .queryParam("response_mode", "form_post")
            .queryParam("scope", "name email")
            .queryParam("state", state)
            .queryParam("nonce", nonce)
            .build()
            .encode()
            .toUri();

    return ResponseEntity
        .status(HttpStatus.FOUND)
        .location(authorizationUri)
        .build();
  }

  @PostMapping("/apple/web/callback")
  public String callback(@RequestParam String code, @RequestParam String state) {
    AppleAuthSession session = appleAuthSessionStore.findAndRemove(state);

    if (session == null) {
      throw new UnauthorizedException("Invalid or expired state");
    }

    AppleTokenResponse tokenResponse = appleTokenClient.exchangeCode(code, appleWebRedirectUri);
    String token = authService.signInWithAppleWebAuth(tokenResponse.idToken(), session.nonce());

    return token;
  }
}
