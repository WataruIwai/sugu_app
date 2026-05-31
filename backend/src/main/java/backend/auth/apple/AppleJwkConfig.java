package backend.auth.apple;

import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import java.net.MalformedURLException;
import java.net.URI;
import java.util.concurrent.TimeUnit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppleJwkConfig {
  @Bean
  public JwkProvider appleJwkProvider() throws MalformedURLException {
    return new JwkProviderBuilder(URI.create("https://appleid.apple.com/auth/keys").toURL())
        .cached(10, 24, TimeUnit.HOURS)
        .rateLimited(10, 1, TimeUnit.MINUTES)
        .build();
  }
}
