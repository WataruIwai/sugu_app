package backend.auth.dto;

public class AuthRequest {
    private String inputMail;
    private String inputPassword;
    private Boolean agreedToTerms;

    public AuthRequest(String inputMail, String inputPassword, Boolean agreedToTerms) {
        this.inputMail = inputMail;
        this.inputPassword = inputPassword;
        this.agreedToTerms = agreedToTerms;
    }

    public String getInputMail() {
        return inputMail;
    }

    public String getInputPassword() {
        return inputPassword;
    }
    public Boolean isAgreedToTerms() {
        return agreedToTerms;
    }
}
