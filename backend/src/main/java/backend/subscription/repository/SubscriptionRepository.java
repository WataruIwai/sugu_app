package backend.subscription.repository;

import backend.exception.NotFoundException;
import backend.subscription.util.DetermineStatus;
import backend.user.domain.User;
import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class SubscriptionRepository {
  private final JdbcClient jdbcClient;
  private final DetermineStatus determineStatus;

  public SubscriptionRepository(JdbcClient jdbcClient, DetermineStatus determineStatus) {
    this.jdbcClient = jdbcClient;
    this.determineStatus = determineStatus;
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

  public void upsertPurchaseRecord(JWSTransactionDecodedPayload transaction, User user) {
    String sql =
        """
          INSERT INTO subscriptions (
            user_id,
            original_transaction_id,
            latest_transaction_id,
            product_id,
            expires_at,
            revocation_date,
            status
          )
          VALUES (
            :userId,
            :originalTransactionId,
            :latestTransactionId,
            :productId,
            :expiresAt,
            :revocationDate,
            :status
          )
            ON CONFLICT (original_transaction_id)
            DO UPDATE SET
              latest_transaction_id = EXCLUDED.latest_transaction_id,
              product_id = EXCLUDED.product_id,
              expires_at = EXCLUDED.expires_at,
              revocation_date = EXCLUDED.revocation_date,
              status = EXCLUDED.status,
              updated_at = CURRENT_TIMESTAMP
          """;

    Instant expiresAt = Instant.ofEpochMilli(transaction.getExpiresDate());

    Instant revocationDate =
        transaction.getRevocationDate() == null
            ? null
            : Instant.ofEpochMilli(transaction.getRevocationDate());
    String status = determineStatus.execute(expiresAt, revocationDate);

    jdbcClient
        .sql(sql)
        .param("userId", user.getId())
        .param("originalTransactionId", transaction.getOriginalTransactionId())
        .param("latestTransactionId", transaction.getTransactionId())
        .param("productId", transaction.getProductId())
        .param("expiresAt", Timestamp.from(expiresAt))
        .param("revocationDate", revocationDate == null ? null : Timestamp.from(revocationDate))
        .param("status", status)
        .update();
  }

  public boolean isActive(long userId) {
    String sql =
        """
            SELECT EXISTS (
              SELECT 1
              FROM subscriptions
              WHERE user_id = :userId
                AND status = 'ACTIVE'
                AND expires_at > CURRENT_TIMESTAMP
                AND revocation_date IS NULL
            );
          """;

    return jdbcClient.sql(sql).param("userId", userId).query(Boolean.class).single();
  }
}
