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
    private int bonusUsedCount;

    public GuestUsageCount(long id, String guestId, LocalDate usageDate, int baseLimit, int bonusCount, int usedCount) {
        this(id, guestId, usageDate, baseLimit, bonusCount, usedCount, 0);
    }

    public GuestUsageCount(long id, String guestId, LocalDate usageDate, int baseLimit, int bonusCount, int usedCount, int bonusUsedCount) {
        this.id = id;
        this.guestId = guestId;
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

    @Override
    public boolean canBonusSearch() {
        return getRemainingBonusCount() > 0;
    }

    @Override
    public void consumeBonus() {
        if(!canBonusSearch()) {
            throw new IllegalStateException("Bonus Search limit exceeded");
        }
        this.bonusUsedCount++;
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

    public int getBonusUsedCount() {
        return bonusUsedCount;
    }
}
