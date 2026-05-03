package backend.auth.dto;

public class VerifiedAppleUserInfo {
    private String sub;
    private String email;

    public VerifiedAppleUserInfo(String sub, String email) {
        this.sub = sub;
        this.email = email;
    }

    public String getSub() {
        return sub;
    }

    public String getEmail() {
        return email;
    }
}
