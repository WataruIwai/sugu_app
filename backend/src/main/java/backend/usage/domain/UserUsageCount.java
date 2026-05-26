package backend.usage.domain;

import java.time.LocalDate;

import backend.usage.interfaces.UsageCount;

public class UserUsageCount implements UsageCount {
    private final long id;
    private final long userId;
    private final LocalDate usageDate;
    private int baseLimit;
    private int bonusCount;
    private int usedCount;
    private int bonusUsedCount;

    public UserUsageCount(long id, long userId, LocalDate usageDate, int baseLimit, int bonusCount, int usedCount, int bonusUsedCount) {
        this.id = id;
        this.userId = userId;
        this.usageDate = usageDate;
        this.baseLimit = baseLimit;
        this.bonusCount = bonusCount;
        this.usedCount = usedCount;
        this.bonusUsedCount = bonusUsedCount;
    }

    @Override
    public int getRemainingCount() {
        return baseLimit - usedCount;
    }

    @Override
    public int getRemainingBonusCount() {
        return bonusCount - bonusUsedCount;
    }

    public long getUserId() {
        return userId;
    }

    public LocalDate getUsageDate() {
        return usageDate;
    }

    public int getUsedCount() {
        return usedCount;
    }

    public int getBonusUsedCount() {
        return bonusUsedCount;
    }
}
