package backend.user.domain;

public class User {
    private String email;
    private String passwordHash;

    public User(String email, String passwordHash) {
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }
}
