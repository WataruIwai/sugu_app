package backend.filter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final SearchRateLimitFilter searchRateLimitFilter;

  public SecurityConfig(
      JwtAuthenticationFilter jwtAuthenticationFilter, SearchRateLimitFilter searchRateLimitFilter) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.searchRateLimitFilter = searchRateLimitFilter;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http.csrf(csrf -> csrf.disable())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterAfter(searchRateLimitFilter, JwtAuthenticationFilter.class)
        .build();
  }
}
