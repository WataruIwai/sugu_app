package backend.user.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public class User {
  private long id;
  private String email;
  private String authProvider;
  private String providerUserId;
  private String termsVersion;
  private LocalDateTime agreedTermsAt;
  private UUID appAccountToken;

  // DBから取得したユーザー情報
  private User(
      long id, String email, String authProvider, String providerUserId, UUID appAccountToken) {
    this.id = id;
    this.email = email;
    this.authProvider = authProvider;
    this.providerUserId = providerUserId;
    this.appAccountToken = appAccountToken;
  }

  private User(
      String email,
      String authProvider,
      String providerUserId,
      String termsVersion,
      LocalDateTime agreedTermsAt,
      UUID appAccountToken) {
    this.email = email;
    this.authProvider = authProvider;
    this.providerUserId = providerUserId;
    this.termsVersion = termsVersion;
    this.agreedTermsAt = agreedTermsAt;
    this.appAccountToken = appAccountToken;
  }

  public static User fromDb(
      long id, String email, String authProvider, String providerUserId, UUID appAccountToken) {
    return new User(id, email, authProvider, providerUserId, appAccountToken);
  }

  public static User forAppleSignUp(
      String email,
      String authProvider,
      String providerUserId,
      String termsVersion,
      LocalDateTime agreedTermsAt,
      UUID appAccountToken) {
    return new User(
        email, authProvider, providerUserId, termsVersion, agreedTermsAt, appAccountToken);
  }

  public long getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getAuthProvider() {
    return authProvider;
  }

  public String getProviderUserId() {
    return providerUserId;
  }

  public String getTermsVersion() {
    return termsVersion;
  }

  public LocalDateTime getAgreedTermsAt() {
    return agreedTermsAt;
  }

  public UUID getAppAccountToken() {
    return appAccountToken;
  }
}
