package backend.dictionary.util;

public class SearchContext {
    private final Long userId;
    private final String guestId;

    private SearchContext(Long userId, String guestId) {
        this.userId = userId;
        this.guestId = guestId;
    }

    public static SearchContext forUser(Long userId) {
        return new SearchContext(userId, null);
    }

    public static SearchContext forGuest(String guestId) {
        return new SearchContext(null, guestId);
    }

    public boolean isUser() {
        return userId != null;
    }

    public boolean isGuest() {
        return guestId != null;
    }

    public Long getUserId() {
        return userId;
    }

    public String getGuestId() {
        return guestId;
    }
}
