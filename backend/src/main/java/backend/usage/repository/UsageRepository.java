package backend.usage.repository;

import backend.usage.domain.GuestUsageCount;
import backend.usage.domain.UserUsageCount;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UsageRepository {
  private final JdbcClient jdbcClient;
  private final int bonusAmount;

  public UsageRepository(JdbcClient jdbcClient, @Value("${usage.bonus-amount}") int bonusAmount) {
    this.jdbcClient = jdbcClient;
    this.bonusAmount = bonusAmount;
  }

  public Optional<UserUsageCount> getUserUsage(long userId) {
    String sql =
        """
            SELECT id, user_id, usage_date, base_limit, bonus_count, used_count, bonus_used_count
            FROM user_search_usage
            WHERE user_id = :userId AND usage_date = :usageDate
        """;

    return jdbcClient
        .sql(sql)
        .param("userId", userId)
        .param("usageDate", java.sql.Date.valueOf(LocalDate.now()))
        .query((ResultSet rs, int rowNum) -> toUserUsageCount(rs))
        .optional();
  }

  public UserUsageCount createUserUsage(long userId) {
    String sql =
        """
            INSERT INTO user_search_usage (user_id, usage_date)
            VALUES (:userId, :usageDate)
            ON CONFLICT (user_id, usage_date) DO NOTHING
            RETURNING id, user_id, usage_date, base_limit, bonus_count, used_count, bonus_used_count
        """;

    return jdbcClient
        .sql(sql)
        .param("userId", userId)
        .param("usageDate", java.sql.Date.valueOf(LocalDate.now()))
        .query((ResultSet rs, int rowNum) -> toUserUsageCount(rs))
        .optional()
        .orElseGet(
            () ->
                getUserUsage(userId)
                    .orElseThrow(
                        () -> new RuntimeException("Failed to load user usage after conflict")));
  }

  public void addBonusCountToUserUsage(UserUsageCount usage) {
    String sql =
        """
            UPDATE user_search_usage
            SET bonus_count = bonus_count + :bonusAmount
            WHERE user_id = :userId AND usage_date = :usageDate
        """;

    jdbcClient
        .sql(sql)
        .param("bonusAmount", bonusAmount)
        .param("userId", usage.getUserId())
        .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
        .update();
  }

  /**
   * 通常検索回数を1回消費する。 後続処理が失敗した場合は rollbackUserUsage で戻す。
   *
   * @param usage 消費対象のユーザー検索回数
   * @return 消費できた場合 true、上限到達で更新されなかった場合 false
   */
  public boolean consumeUserUsage(UserUsageCount usage) {
    String sql =
        """
            UPDATE user_search_usage
            SET used_count = used_count + 1
            WHERE user_id = :userId
            AND usage_date = :usageDate
            AND used_count < base_limit
        """;

    int affectedRows =
        jdbcClient
            .sql(sql)
            .param("userId", usage.getUserId())
            .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
            .update();

    return affectedRows == 1;
  }

  public void rollbackUserUsage(UserUsageCount usage) {
    String sql =
        """
            UPDATE user_search_usage
            SET used_count = used_count - 1
            WHERE user_id = :userId
            AND usage_date = :usageDate
            AND used_count > 0
        """;

    jdbcClient
        .sql(sql)
        .param("userId", usage.getUserId())
        .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
        .update();
  }

  public boolean consumeUserBonusUsage(UserUsageCount usage) {
    String sql =
        """
            UPDATE user_search_usage
            SET bonus_used_count = bonus_used_count + 1
            WHERE user_id = :userId
            AND usage_date = :usageDate
            AND bonus_used_count < bonus_count
        """;

    int affectedRows =
        jdbcClient
            .sql(sql)
            .param("userId", usage.getUserId())
            .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
            .update();

    return affectedRows == 1;
  }

  public void rollbackUserBonusUsage(UserUsageCount usage) {
    String sql =
        """
            UPDATE user_search_usage
            SET bonus_used_count = bonus_used_count - 1
            WHERE user_id = :userId
            AND usage_date = :usageDate
            AND bonus_used_count > 0
        """;

    jdbcClient
        .sql(sql)
        .param("userId", usage.getUserId())
        .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
        .update();
  }

  public Optional<GuestUsageCount> getGuestUsage(String guestId) {
    String sql =
        """
            SELECT id, guest_id, usage_date, base_limit, bonus_count, used_count, bonus_used_count
            FROM guest_search_usage
            WHERE guest_id = :guestId AND usage_date = :usageDate
        """;

    return jdbcClient
        .sql(sql)
        .param("guestId", guestId)
        .param("usageDate", java.sql.Date.valueOf(LocalDate.now()))
        .query((ResultSet rs, int rowNum) -> toGuestUsageCount(rs))
        .optional();
  }

  public GuestUsageCount createGuestUsage(String guestId) {
    String sql =
        """
            INSERT INTO guest_search_usage (guest_id, usage_date)
            VALUES (:guestId, :usageDate)
            ON CONFLICT (guest_id, usage_date) DO NOTHING
            RETURNING id, guest_id, usage_date, base_limit, bonus_count, used_count, bonus_used_count
        """;

    return jdbcClient
        .sql(sql)
        .param("guestId", guestId)
        .param("usageDate", java.sql.Date.valueOf(LocalDate.now()))
        .query((ResultSet rs, int rowNum) -> toGuestUsageCount(rs))
        .optional()
        .orElseGet(
            () ->
                getGuestUsage(guestId)
                    .orElseThrow(
                        () -> new RuntimeException("Failed to load guest usage after conflict")));
  }

  public void addBonusCountToGuestUsage(GuestUsageCount usage) {
    String sql =
        """
            UPDATE guest_search_usage
            SET bonus_count = bonus_count + :bonusAmount
            WHERE guest_id = :guestId AND usage_date = :usageDate
        """;

    jdbcClient
        .sql(sql)
        .param("bonusAmount", bonusAmount)
        .param("guestId", usage.getGuestId())
        .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
        .update();
  }

  public boolean consumeGuestUsage(GuestUsageCount usage) {
    String sql =
        """
            UPDATE guest_search_usage
            SET used_count = used_count + 1
            WHERE guest_id = :guestId
            AND usage_date = :usageDate
            AND used_count < base_limit
        """;

    int affectedRows =
        jdbcClient
            .sql(sql)
            .param("guestId", usage.getGuestId())
            .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
            .update();

    return affectedRows == 1;
  }

  public void rollbackGuestUsage(GuestUsageCount usage) {
    String sql =
        """
            UPDATE guest_search_usage
            SET used_count = used_count - 1
            WHERE guest_id = :guestId
            AND usage_date = :usageDate
            AND used_count > 0
        """;

    jdbcClient
        .sql(sql)
        .param("guestId", usage.getGuestId())
        .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
        .update();
  }

  public boolean consumeGuestBonusUsage(GuestUsageCount usage) {
    String sql =
        """
            UPDATE guest_search_usage
            SET bonus_used_count = bonus_used_count + 1
            WHERE guest_id = :guestId
            AND usage_date = :usageDate
            AND bonus_used_count < bonus_count
        """;

    int affectedRows =
        jdbcClient
            .sql(sql)
            .param("guestId", usage.getGuestId())
            .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
            .update();

    return affectedRows == 1;
  }

  public void rollbackGuestBonusUsage(GuestUsageCount usage) {
    String sql =
        """
            UPDATE guest_search_usage
            SET bonus_used_count = bonus_used_count - 1
            WHERE guest_id = :guestId
            AND usage_date = :usageDate
            AND bonus_used_count > 0
        """;

    jdbcClient
        .sql(sql)
        .param("guestId", usage.getGuestId())
        .param("usageDate", java.sql.Date.valueOf(usage.getUsageDate()))
        .update();
  }

  private UserUsageCount toUserUsageCount(ResultSet rs) throws java.sql.SQLException {
    return new UserUsageCount(
        rs.getLong("id"),
        rs.getLong("user_id"),
        rs.getDate("usage_date").toLocalDate(),
        rs.getInt("base_limit"),
        rs.getInt("bonus_count"),
        rs.getInt("used_count"),
        rs.getInt("bonus_used_count"));
  }

  private GuestUsageCount toGuestUsageCount(ResultSet rs) throws java.sql.SQLException {
    return new GuestUsageCount(
        rs.getLong("id"),
        rs.getString("guest_id"),
        rs.getDate("usage_date").toLocalDate(),
        rs.getInt("base_limit"),
        rs.getInt("bonus_count"),
        rs.getInt("used_count"),
        rs.getInt("bonus_used_count"));
  }
}
