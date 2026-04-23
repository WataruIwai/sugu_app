package backend.usage.domain;

import java.time.LocalDate;

import backend.usage.interfaces.UsageCount;

public class GuestUsageCount implements UsageCount {
    private final long id;
    private final String guestId;
    private final LocalDate usageDate;
    private int baseLimit;
    private int bonusCount;
    private int usedCount;

    public GuestUsageCount(long id, String guestId, LocalDate usageDate, int baseLimit, int bonusCount, int usedCount) {
        this.id = id;
        this.guestId = guestId;
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

