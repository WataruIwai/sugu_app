package backend.subscription.util;

import java.time.Instant;
import org.springframework.stereotype.Component;

@Component
public class DetermineStatus {
  public String execute(Instant expiresDate, Instant revocationDate) {
    if (expiresDate == null || !expiresDate.isAfter(Instant.now())) {
      return "EXPIRED";
    }
    if (revocationDate != null) {
      return "EXPIRED";
    }
    return "ACTIVE";
  }
}
