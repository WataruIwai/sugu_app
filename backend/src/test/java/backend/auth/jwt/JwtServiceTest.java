package backend.auth.jwt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import backend.exception.UnauthorizedException;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
  private static final String JWT_SECRET =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  @Test
  void extractUserIdFromGeneratedToken() {
    JwtService jwtService = new JwtService(JWT_SECRET, Duration.ofHours(24));

    String token = jwtService.generateToken((123L));

    assertEquals(123L, jwtService.extractUserId(token));
  }

  @Test
  void throwUnauthorizedWhenTokenIsTampered() {
    JwtService jwtService = new JwtService(JWT_SECRET, Duration.ofHours(24));
    String token = jwtService.generateToken(123L);

    String tamperedToken =
        token.substring(0, token.length() - 1) + (token.endsWith("x") ? "y" : "x");

    assertThrows(
        UnauthorizedException.class,
        () -> jwtService.extractUserIdFromHeader("Bearer" + tamperedToken));
  }

  @Test
  void throwUnauthorizedWhenTokenIsExpired() {
    JwtService jwtService = new JwtService(JWT_SECRET, Duration.ofSeconds(-1));
    String token = jwtService.generateToken(123L);

    assertThrows(
        UnauthorizedException.class, () -> jwtService.extractUserIdFromHeader("Bearer" + token));
  }
}
