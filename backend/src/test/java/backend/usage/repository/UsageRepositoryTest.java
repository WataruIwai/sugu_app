package backend.usage.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import backend.usage.domain.GuestUsageCount;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class UsageRepositoryTest {
  private static final String TEST_GUEST_ID = "jdbc-usage-repository-test-guest";
  private static final LocalDate TODAY = LocalDate.now();
  private static final int BONUS_AMOUNT = 3;

  @Autowired private JdbcClient jdbcClient;

  private UsageRepository usageRepository;

  @BeforeEach
  void setUp() {
    usageRepository = new UsageRepository(jdbcClient, BONUS_AMOUNT);
    cleanUp();
  }

  @AfterEach
  void tearDown() {
    cleanUp();
  }

  @Test
  void consumeGuestUsageDoesNotExceedBaseLimitWhenRequestsRunConcurrently() throws Exception {
    GuestUsageCount usage = insertGuestUsage(1, 0);

    List<Boolean> results =
        runTwoRequestsAtSameTime(() -> usageRepository.consumeGuestUsage(usage));

    assertEquals(1, results.stream().filter(Boolean::booleanValue).count());
    assertEquals(1, getGuestUsageCountColumn("used_count"));
  }

  private List<Boolean> runTwoRequestsAtSameTime(ThrowingBooleanSupplier request) throws Exception {
    ExecutorService executorService = Executors.newFixedThreadPool(2);
    CountDownLatch ready = new CountDownLatch(2);
    CountDownLatch start = new CountDownLatch(1);

    try {
      Future<Boolean> first =
          executorService.submit(() -> executeAfterStartSignal(request, ready, start));
      Future<Boolean> second =
          executorService.submit(() -> executeAfterStartSignal(request, ready, start));

      ready.await();
      start.countDown();

      return List.of(first.get(), second.get());
    } finally {
      executorService.shutdownNow();
    }
  }

  private boolean executeAfterStartSignal(
      ThrowingBooleanSupplier request, CountDownLatch ready, CountDownLatch start)
      throws Exception {
    ready.countDown();
    start.await();
    return request.getAsBoolean();
  }

  private GuestUsageCount insertGuestUsage(int baseLimit, int usedCount) {
    return jdbcClient
        .sql(
            """
            INSERT INTO guest_search_usage
              (guest_id, usage_date, base_limit, used_count)
            VALUES
              (:guestId, :usageDate, :baseLimit, :usedCount)
            RETURNING id, guest_id, usage_date, base_limit, used_count
            """)
        .param("guestId", TEST_GUEST_ID)
        .param("usageDate", java.sql.Date.valueOf(TODAY))
        .param("baseLimit", baseLimit)
        .param("usedCount", usedCount)
        .query(
            (rs, rowNum) ->
                new GuestUsageCount(
                    rs.getLong("id"),
                    rs.getString("guest_id"),
                    rs.getDate("usage_date").toLocalDate(),
                    rs.getInt("base_limit"),
                    rs.getInt("used_count")))
        .single();
  }

  private int getGuestUsageCountColumn(String columnName) {
    return jdbcClient
        .sql(
            """
            SELECT %s
            FROM guest_search_usage
            WHERE guest_id = :guestId AND usage_date = :usageDate
            """
                .formatted(columnName))
        .param("guestId", TEST_GUEST_ID)
        .param("usageDate", java.sql.Date.valueOf(TODAY))
        .query(Integer.class)
        .single();
  }

  private void cleanUp() {
    jdbcClient
        .sql(
            """
            DELETE FROM guest_search_usage
            WHERE guest_id = :guestId
            """)
        .param("guestId", TEST_GUEST_ID)
        .update();
  }

  @FunctionalInterface
  private interface ThrowingBooleanSupplier {
    boolean getAsBoolean() throws Exception;
  }
}
