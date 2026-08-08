package backend.filter;

import backend.dictionary.util.SearchContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SearchRateLimitFilter extends OncePerRequestFilter {
  private static final long WINDOW_MILLIS = 60_000;
  private static final int IP_LIMIT_PER_MINUTE = 60;
  private static final int ACTOR_LIMIT_PER_MINUTE = 20;

  private final ConcurrentHashMap<String, RateLimitWindow> requestCounts =
      new ConcurrentHashMap<>();

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    if (!isSearchRequest(request)) {
      filterChain.doFilter(request, response);
      return;
    }

    String clientIp = resolveClientIp(request);
    String actorKey = resolveActorKey();

    if (actorKey == null) {
      rejectUnauthorized(response);
      return;
    }

    if (isLimited("ip:" + clientIp, IP_LIMIT_PER_MINUTE)
        || isLimited(actorKey + ":ip:" + clientIp, ACTOR_LIMIT_PER_MINUTE)) {
      reject(response);
      return;
    }

    filterChain.doFilter(request, response);
  }

  private static class RateLimitWindow {
    private final long expiresAtMillis;
    private final int count;

    private RateLimitWindow(long expiresAtMillis, int count) {
      this.expiresAtMillis = expiresAtMillis;
      this.count = count;
    }
  }

  private boolean isLimited(String key, int limit) {
    long now = System.currentTimeMillis();
    boolean[] limited = {false};

    requestCounts.compute(
        key,
        (_key, currentWindow) -> {
          if (currentWindow == null || currentWindow.expiresAtMillis <= now) {
            return new RateLimitWindow(now + WINDOW_MILLIS, 1);
          }

          int nextCount = currentWindow.count + 1;

          if (nextCount > limit) {
            limited[0] = true;
          }

          return new RateLimitWindow(currentWindow.expiresAtMillis, nextCount);
        });

    return limited[0];
  }

  private void reject(HttpServletResponse response) throws IOException {
    response.setStatus(429);
    response.setCharacterEncoding("UTF-8");
    response.setContentType("application/json");
    response.getWriter().write("{\"message\":\"TOO_MANY_REQUESTS\"}");
  }

  private void rejectUnauthorized(HttpServletResponse response) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setCharacterEncoding("UTF-8");
    response.setContentType("application/json");
    response.getWriter().write("{\"message\":\"認証に失敗しました\"}");
  }

  boolean isSearchRequest(HttpServletRequest request) {
    String method = request.getMethod();
    String path = request.getRequestURI();

    return "POST".equalsIgnoreCase(method) && path.equals("/api/v1/dictionary/search");
  }

  String resolveClientIp(HttpServletRequest request) {
    String cfIp = request.getHeader("CF-Connecting-IP");
    if (cfIp != null && !cfIp.isBlank()) {
      return cfIp;
    }

    String forwardedFor = request.getHeader("X-Forwarded-For");
    if (forwardedFor != null && !forwardedFor.isBlank()) {
      return forwardedFor.split(",")[0].trim();
    }

    return request.getRemoteAddr();
  }

  private String resolveActorKey() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
  
    if (authentication == null) {
      return null;
    }
  
    Object principal = authentication.getPrincipal();
  
    if (!(principal instanceof SearchContext searchContext)) {
      return null;
    }
  
    if (searchContext.isUser()) {
      return "user:" + searchContext.getUserId();
    }
  
    if (searchContext.isGuest()) {
      return "guest:" + searchContext.getGuestId();
    }
  
    return null;
  }


}
