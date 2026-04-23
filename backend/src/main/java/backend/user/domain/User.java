package backend.user.domain;

import java.time.LocalDateTime;

public class User {
    private long id;
    private String email;
    private String passwordHash;
    private String termsVersion;
    private LocalDateTime agreedTermsAt;

    //DBから取得したユーザー情報
    public User(long id, String email, String passwordHash) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    //新規登録前
    public User(String email, String passwordHash, String termsVersion, LocalDateTime agreedTermsAt) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.termsVersion = termsVersion;
        this.agreedTermsAt = agreedTermsAt;
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

    public String getTermsVersion() {
        return termsVersion;
    }

    public LocalDateTime getAgreedTermsAt() {
        return agreedTermsAt;
    }
}
