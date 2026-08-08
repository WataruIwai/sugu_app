package backend.usage.domain;

import backend.usage.interfaces.UsageCount;
import java.time.LocalDate;

public class GuestUsageCount implements UsageCount {
  private final long id;
  private final String guestId;
  private final LocalDate usageDate;
  private int baseLimit;
  private int usedCount;

  public GuestUsageCount(
      long id, String guestId, LocalDate usageDate, int baseLimit, int usedCount) {
    this(id, guestId, usageDate, baseLimit, usedCount, 0);
  }

  public GuestUsageCount(
      long id,
      String guestId,
      LocalDate usageDate,
      int baseLimit,
      int bonusCount,
      int usedCount
    ) {
    this.id = id;
    this.guestId = guestId;
    this.usageDate = usageDate;
    this.baseLimit = baseLimit;
    this.usedCount = usedCount;
  }

  @Override
  public int getRemainingCount() {
    return baseLimit - usedCount;
  }

  public String getGuestId() {
    return guestId;
  }

  public LocalDate getUsageDate() {
    return usageDate;
  }

  public int getUsedCount() {
    return usedCount;
  }
}
