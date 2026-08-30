package backend.auth.dto;

public class GoogleAuthRequest {
    private String identityToken;
    private Boolean agreedToTerms;

    public GoogleAuthRequest() {}

    public GoogleAuthRequest(String identityToken, Boolean agreedToTerms) {
        this.identityToken = identityToken;
        this.agreedToTerms = agreedToTerms;
    }

    public String getIdentityToken() {
        return identityToken;
    }

    public void setIdentityToken(String identityToken) {
        this.identityToken = identityToken;
    }

    public Boolean getAgreedToTerms() {
        return agreedToTerms;
    }

    public void setAgreedToTerms(Boolean agreedToTerms) {
        this.agreedToTerms = agreedToTerms;
    }
}
