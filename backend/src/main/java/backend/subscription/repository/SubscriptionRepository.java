package backend.subscription.repository;

import backend.exception.NotFoundException;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class SubscriptionRepository {
  private final JdbcClient jdbcClient;

  public SubscriptionRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  public UUID setAppAccountTokenIfAbsent(long userId, UUID appAccountToken) {
    String sql =
        """
            UPDATE users
            SET app_account_token = COALESCE(app_account_token, :newAppAccountToken)
            WHERE id = :userId
            RETURNING app_account_token
        """;

    return jdbcClient
        .sql(sql)
        .param("newAppAccountToken", appAccountToken)
        .param("userId", userId)
        .query(UUID.class)
        .optional()
        .orElseThrow(() -> new NotFoundException("User not found"));
  }
}
