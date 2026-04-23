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

    public UserUsageCount(long id, long userId, LocalDate usageDate, int baseLimit, int bonusCount, int usedCount) {
        this.id = id;
        this.userId = userId;
        this.usageDate = usageDate;
        this.baseLimit = baseLimit;
        this.bonusCount = bonusCount;
        this.usedCount = usedCount;
    }

    @Override
    public int getRemainingCount() {
        return baseLimit - usedCount;
    }

    @Override
    public boolean canSearch() {
        return getRemainingCount() > 0;
    }

    @Override
    public void consume() {
        if(!canSearch()) {
            throw new IllegalStateException("Search limit exceeded");
        }
        this.usedCount++;
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
}
