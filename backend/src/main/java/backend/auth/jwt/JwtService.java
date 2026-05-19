package backend.auth.jwt;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import backend.exception.UnauthorizedException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtService {
    final private SecretKey key;

    public JwtService(@Value("${jwt.secret}") String jwtSecret) {
        this.key = Keys.hmacShaKeyFor(
            jwtSecret.getBytes(StandardCharsets.UTF_8)
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

    public Long extractUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Long.valueOf(claims.getSubject());
    }

    public long extractUserIdFromHeader(String authorizationHeader) {
        String token = authorizationHeader.substring(7);
        try {
            return this.extractUserId(token);
        } catch (Exception e) {
            throw new UnauthorizedException("Authentication required");
        }
    }
}
