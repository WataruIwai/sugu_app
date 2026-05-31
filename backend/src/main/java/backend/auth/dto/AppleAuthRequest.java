package backend.auth.dto;

public class AppleAuthRequest {
  private String identityToken;
  private String expectedNonceHash;
  private Boolean agreedToTerms;

  public AppleAuthRequest() {}

  public AppleAuthRequest(String identityToken, String expectedNonceHash, Boolean agreedToTerms) {
    this.identityToken = identityToken;
    this.expectedNonceHash = expectedNonceHash;
    this.agreedToTerms = agreedToTerms;
  }

  public String getIdentityToken() {
    return identityToken;
  }

  public String getExpectedNonceHash() {
    return expectedNonceHash;
  }

  public void setIdentityToken(String identityToken) {
    this.identityToken = identityToken;
  }

  public void setExpectedNonceHash(String expectedNonceHash) {
    this.expectedNonceHash = expectedNonceHash;
  }

  public Boolean getAgreedToTerms() {
    return agreedToTerms;
  }

  public void setAgreedToTerms(Boolean agreedToTerms) {
    this.agreedToTerms = agreedToTerms;
  }
}
