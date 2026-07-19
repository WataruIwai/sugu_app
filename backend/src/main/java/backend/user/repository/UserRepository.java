package backend.user.repository;

import backend.user.domain.User;
import java.sql.Timestamp;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
  private final JdbcClient jdbcClient;

  public UserRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  public User getUser(long userId) {
    String sql =
        """
            SELECT id, email, auth_provider, provider_user_id, app_account_token FROM users WHERE id = :userId
        """;

    RowMapper<User> rowMapper =
        (rs, rowNum) ->
            User.fromDb(
                rs.getLong("id"),
                rs.getString("email"),
                rs.getString("auth_provider"),
                rs.getString("provider_user_id"),
                rs.getObject("app_account_token", UUID.class));

    return jdbcClient
        .sql(sql)
        .param("userId", userId)
        .query(rowMapper)
        .optional()
        .orElse(null);
  }

  /**
   * ユーザーを削除すると、ON DELETE CASCADE により ユーザーに紐づく単語データなども削除される。
   *
   * @param userId
   */
  public void deleteUser(long userId) {
    String sql =
        """
            DELETE FROM users WHERE id = :userId
        """;

    jdbcClient.sql(sql).param("userId", userId).update();
  }

  public void updateAppAccountToken(long userId, UUID appAccountToken) {
    String sql =
        """
            UPDATE users
            SET app_account_token = :appAccountToken
            WHERE id = :userId
        """;

    jdbcClient
        .sql(sql)
        .param("userId", userId)
        .param("appAccountToken", appAccountToken)
        .update();
  }

  public User getUserByProviderUserId(String providerUserId) {
    String sql =
        """
            SELECT id, email, auth_provider, provider_user_id, app_account_token FROM users WHERE provider_user_id = :providerUserId
        """;

    RowMapper<User> rowMapper =
        (rs, rowNum) ->
            User.fromDb(
                rs.getLong("id"),
                rs.getString("email"),
                rs.getString("auth_provider"),
                rs.getString("provider_user_id"),
                rs.getObject("app_account_token", UUID.class));

    return jdbcClient
        .sql(sql)
        .param("providerUserId", providerUserId)
        .query(rowMapper)
        .optional()
        .orElse(null);

  }

  public long createUserWithAppleId(User newUser) {

    String sql =
        """
            INSERT INTO users (email, auth_provider, provider_user_id, terms_version, agreed_terms_at, app_account_token)
            VALUES (:email, :authProvider, :providerUserId, :termsVersion, :agreedTermsAt, :appAccountToken)
            RETURNING id
        """;

    return jdbcClient
        .sql(sql)
        .param("email", newUser.getEmail())
        .param("authProvider", newUser.getAuthProvider())
        .param("providerUserId", newUser.getProviderUserId())
        .param("termsVersion", newUser.getTermsVersion())
        .param("agreedTermsAt", Timestamp.valueOf(newUser.getAgreedTermsAt()))
        .param("appAccountToken", newUser.getAppAccountToken())
        .query(long.class)
        .single();
  }
}
