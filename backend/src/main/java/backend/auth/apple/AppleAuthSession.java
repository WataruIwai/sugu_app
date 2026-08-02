package backend.auth.apple;

import java.time.Instant;

public record AppleAuthSession(
    String nonce,
    Instant expiresAt
) {}
