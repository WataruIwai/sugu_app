package backend.user.repository;

import java.sql.ResultSet;
import java.sql.Timestamp;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import backend.user.domain.User;

@Repository
public class UserRepository {
    private final JdbcClient jdbcClient;

    public UserRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public User getUser(long userId) {
        String sql = """
            SELECT id, email, auth_provider, provider_user_id FROM users WHERE id = :userId
        """;

        return jdbcClient.sql(sql)
            .param("userId", userId)
            .query((ResultSet rs, int rowNum) -> User.fromDb(
                rs.getLong("id"),
                rs.getString("email"),
                null,
                rs.getString("auth_provider"),
                rs.getString("provider_user_id")
            ))
            .optional()
            .orElse(null);
    }

    /**
     * ユーザーを削除すると、ON DELETE CASCADE により
     * ユーザーに紐づく単語データなども削除される。
     * @param userId
     */
    public void deleteUser(long userId) {
        String sql = """
            DELETE FROM users WHERE id = :userId
        """;

        jdbcClient.sql(sql)
            .param("userId", userId)
            .update();
    }

    public User getUserByProviderUserId(String providerUserId) {
        String sql = """
            SELECT id, email, auth_provider, provider_user_id FROM users WHERE provider_user_id = :providerUserId
        """;

        return jdbcClient.sql(sql)
            .param("providerUserId", providerUserId)
            .query((ResultSet rs, int rowNum) -> User.fromDb(
                rs.getLong("id"),
                rs.getString("email"),
                null,
                rs.getString("auth_provider"),
                rs.getString("provider_user_id")
            ))
            .optional()
            .orElse(null);
    }

    public long createUserWithAppleId(User newUser) {
        String sql = """
            INSERT INTO users (email, auth_provider, provider_user_id, terms_version, agreed_terms_at)
            VALUES (:email, :authProvider, :providerUserId, :termsVersion, :agreedTermsAt)
            RETURNING id
        """;

        return jdbcClient.sql(sql)
            .param("email", newUser.getEmail())
            .param("authProvider", newUser.getAuthProvider())
            .param("providerUserId", newUser.getProviderUserId())
            .param("termsVersion", newUser.getTermsVersion())
            .param("agreedTermsAt", Timestamp.valueOf(newUser.getAgreedTermsAt()))
            .query(long.class)
            .single();
    }
}
