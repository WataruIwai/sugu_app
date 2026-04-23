package backend.usage.interfaces;

public interface UsageCount {
    boolean canSearch();
    void consume();
    int getRemainingCount();
}
