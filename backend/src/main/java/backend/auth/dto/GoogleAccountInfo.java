package backend.auth.dto;

public class GoogleAccountInfo {
    private String subject;
    private String gmail;

    public GoogleAccountInfo(String subject, String gmail) {
        this.subject = subject;
        this.gmail = gmail;
    }

    public String getSub() {
        return subject;
    }

    public String getGmail() {
        return gmail;
    }
}
