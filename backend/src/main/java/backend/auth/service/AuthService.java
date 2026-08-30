package backend.auth.service;

import backend.auth.apple.AppleIdentityTokenVerifier;
import backend.auth.dto.AppleAuthRequest;
import backend.auth.dto.GoogleAccountInfo;
import backend.auth.dto.GoogleAuthRequest;
import backend.auth.dto.VerifiedAppleUserInfo;
import backend.auth.google.GoogleIdentityTokenVerifier;
import backend.auth.jwt.JwtService;
import backend.exception.BadRequestException;
import backend.user.domain.User;
import backend.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
  private UserRepository userRepository;
  private JwtService jwtService;
  private AppleIdentityTokenVerifier appleIdentityTokenVerifier;
  private GoogleIdentityTokenVerifier googleIdentityTokenVerifier;

  public AuthService(
      UserRepository userRepository,
      JwtService jwtService,
      AppleIdentityTokenVerifier appleIdentityTokenVerifier,
      GoogleIdentityTokenVerifier googleIdentityTokenVerifier) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
    this.appleIdentityTokenVerifier = appleIdentityTokenVerifier;
    this.googleIdentityTokenVerifier = googleIdentityTokenVerifier;
  }

  public String signInWithAppleAuth(AppleAuthRequest appleAuthRequest) {
    logger.info(
        "AuthService.signInWithAppleAuth started. identityTokenPresent={}",
        appleAuthRequest.getIdentityToken() != null
            && !appleAuthRequest.getIdentityToken().isBlank());

    if (appleAuthRequest.getIdentityToken() == null
        || appleAuthRequest.getIdentityToken().isBlank()) {
      logger.warn("AuthService.signInWithAppleAuth rejected: identityToken is blank");
      throw new BadRequestException("Identity token is required");
    }

    if (!Boolean.TRUE.equals(appleAuthRequest.getAgreedToTerms())) {
      logger.warn("AuthService.signInWithAppleAuth rejected: terms not agreed");
      throw new BadRequestException("You must agree to the terms");
    }

    if (appleAuthRequest.getExpectedNonceHash() == null
        || appleAuthRequest.getExpectedNonceHash().isBlank()) {
      logger.warn("AuthService.signInWithAppleAuth accepted legacy request without nonce");
    }

    VerifiedAppleUserInfo verifiedAppleUserInfo =
        appleIdentityTokenVerifier.execute(
            appleAuthRequest.getIdentityToken(), appleAuthRequest.getExpectedNonceHash());

    return signInOrCreateAppleUser(verifiedAppleUserInfo);
  }

  public String signInWithAppleWebAuth(String identityToken, String expectedNonce) {
    VerifiedAppleUserInfo verifiedAppleUserInfo =
        appleIdentityTokenVerifier.executeForWeb(identityToken, expectedNonce);

    return signInOrCreateAppleUser(verifiedAppleUserInfo);
  }

  private String signInOrCreateAppleUser(VerifiedAppleUserInfo verifiedAppleUserInfo) {
    User user = userRepository.getUserByAuthProviderAndProviderUserId("apple", verifiedAppleUserInfo.getSub());

    if (user == null) {
      UUID appAccountToken = UUID.randomUUID();
      user =
          User.forAppleSignUp(
              verifiedAppleUserInfo.getEmail(),
              verifiedAppleUserInfo.getSub(),
              "v1",
              LocalDateTime.now(),
              appAccountToken);
      long userId = userRepository.createOAuthUser(user);
      String token = jwtService.generateToken(userId);
      return token;
    }

    String token = jwtService.generateToken(user.getId());
    return token;
  }

  public String signInWithGoogleAuth(GoogleAuthRequest request) {
    if (request.getIdentityToken() == null || request.getIdentityToken().isBlank()) {
      throw new BadRequestException("Identity token is required");
    }

    if (!Boolean.TRUE.equals(request.getAgreedToTerms())) {
      throw new BadRequestException("You must agree to the terms");
    }

    // ①フロントから来たトークンの検証
    GoogleAccountInfo googleAccountInfo = googleIdentityTokenVerifier.verify(request.getIdentityToken());
    /*
    ②①から返されたGoogleAccountInfoのgetSubの戻り値を使ってすでにデータがないか確認
    */
    User user = userRepository.getUserByAuthProviderAndProviderUserId("google", googleAccountInfo.getSub());

    // ③存在しなかったパターン
    if(user == null) {
      UUID appAccountToken = UUID.randomUUID();
      user = User.forGoogleSignUp(
        googleAccountInfo.getGmail(),
        googleAccountInfo.getSub(),
        "v1",
        LocalDateTime.now(),
        appAccountToken);

        //ユーザーデータの作成
        long userId = userRepository.createOAuthUser(user);
        //トークンの作成
        String token = jwtService.generateToken(userId);
        //トークンをreturn
        return token;
    }

    //④すでに存在したパターン
    //トークンの作成
    String token = jwtService.generateToken(user.getId());
    //トークンをreturn
    return token;
  }
}
