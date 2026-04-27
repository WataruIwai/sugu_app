package backend.usage.interfaces;

public interface UsageCount {
    boolean canSearch();
    void consume();
    int getRemainingCount();
    boolean canBonusSearch();
    void consumeBonus();
    int getRemainingBonusCount();
}
