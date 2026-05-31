package backend.filter;

import backend.auth.jwt.JwtService;
import backend.dictionary.util.SearchContext;
import backend.exception.UnauthorizedException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtService jwtService;

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String authorizationHeader = request.getHeader("Authorization");
    String guestId = request.getHeader("X-Guest-Id");

    if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
      try {
        // tokenが有効じゃない場合、例外をthrowする
        Long userId = jwtService.extractUserIdFromHeader(authorizationHeader);
        SearchContext searchContext = SearchContext.forUser(userId);
        Authentication authentication =
            new UsernamePasswordAuthenticationToken(searchContext, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
        return;
      } catch (UnauthorizedException e) {
        SecurityContextHolder.clearContext();
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"認証に失敗しました\"}");
        return;
      }
    } else if (guestId != null && isGuestAllowedPath(request)) {
      SearchContext searchContext = SearchContext.forGuest(guestId);
      Authentication authentication =
          new UsernamePasswordAuthenticationToken(searchContext, null, List.of());
      SecurityContextHolder.getContext().setAuthentication(authentication);
      filterChain.doFilter(request, response);
      return;
    } else {
      SecurityContextHolder.clearContext();
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType("application/json");
      response.getWriter().write("{\"message\":\"認証に失敗しました\"}");
      return;
    }
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return request.getRequestURI().equals("/api/v1/auth/apple");
  }

  private boolean isGuestAllowedPath(HttpServletRequest request) {
    String path = request.getRequestURI();

    return path.equals("/api/v1/dictionary/search") || path.equals("/api/v1/usage/bonus");
  }
}
