package backend.user.domain;

import java.time.LocalDateTime;

public class User {
  private long id;
  private String email;
  private String passwordHash;
  private String authProvider;
  private String providerUserId;
  private String termsVersion;
  private LocalDateTime agreedTermsAt;

  // DBから取得したユーザー情報
  private User(
      long id, String email, String passwordHash, String authProvider, String providerUserId) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.authProvider = authProvider;
    this.providerUserId = providerUserId;
  }

  private User(
      String email,
      String authProvider,
      String providerUserId,
      String termsVersion,
      LocalDateTime agreedTermsAt) {
    this.email = email;
    this.authProvider = authProvider;
    this.providerUserId = providerUserId;
    this.termsVersion = termsVersion;
    this.agreedTermsAt = agreedTermsAt;
  }

  public static User fromDb(
      long id, String email, String passwordHash, String authProvider, String providerUserId) {
    return new User(id, email, passwordHash, authProvider, providerUserId);
  }

  public static User forAppleSignUp(
      String email,
      String authProvider,
      String providerUserId,
      String termsVersion,
      LocalDateTime agreedTermsAt) {
    return new User(email, authProvider, providerUserId, termsVersion, agreedTermsAt);
  }

  public long getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getPasswordHash() {
    return passwordHash;
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
}
