package backend.auth.dto;

public class AuthRequest {
    private String inputMail;
    private String inputPassword;

    public AuthRequest(String inputMail, String inputPassword) {
        this.inputMail = inputMail;
        this.inputPassword = inputPassword;
    }

    public String getInputMail() {
        return inputMail;
    }

    public String getInputPassword() {
        return inputPassword;
    }
}
