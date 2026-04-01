package backend.auth.jwt;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.github.cdimascio.dotenv.Dotenv;

@Component
public class JwtService {
    final private SecretKey key;
    Dotenv dotenv = Dotenv.load();

    public JwtService() {
        this.key = Keys.hmacShaKeyFor(
            dotenv.get("JWT_SECRET").getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateToken(Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 24時間

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);

            System.out.println("tokenは有効です");
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Long extractUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Long.valueOf(claims.getSubject());
    }

    public long extractUserIdFromHeader(String authorizationHeader) {
        String token = authorizationHeader.replace("Bearer ", "");
        if (this.isTokenValid(token)) {
            return this.extractUserId(token);
        }

        throw new RuntimeException("再度ログインしてください");
    }
}
