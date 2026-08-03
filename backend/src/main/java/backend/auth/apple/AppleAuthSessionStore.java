package backend.auth.apple;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class AppleAuthSessionStore {

  private final ConcurrentHashMap<String, AppleAuthSession> sessions =
      new ConcurrentHashMap<>();

  public void save(String state, AppleAuthSession session) {
    sessions.put(state, session);
  }

  public AppleAuthSession findAndRemove(String state) {
    AppleAuthSession session = sessions.remove(state);

    if (session == null) {
      return null;
    }

    if (session.expiresAt().isBefore(Instant.now())) {
      return null;
    }

    return session;
  }
}