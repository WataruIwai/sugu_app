package backend.subscription.config;

import com.apple.itunes.storekit.client.AppStoreServerAPIClient;
import com.apple.itunes.storekit.model.Environment;
import com.apple.itunes.storekit.verification.SignedDataVerifier;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppStoreServerApiConfig {

  @Bean
  public AppStoreServerAPIClient appStoreServerAPIClient(
      @Value("${apple.store.private-key-path}") String privateKeyPath,
      @Value("${apple.store.key-id}") String keyId,
      @Value("${apple.store.issuer-id}") String issuerId,
      @Value("${apple.store.bundle-id}") String bundleId,
      @Value("${apple.store.environment:SANDBOX}") Environment environment)
      throws IOException {
    String privateKey = Files.readString(Path.of(privateKeyPath));
    return new AppStoreServerAPIClient(privateKey, keyId, issuerId, bundleId, environment);
  }

  @Bean
  public SignedDataVerifier signedDataVerifier(
      @Value("${apple.store.bundle-id}") String bundleId,
      @Value("${apple.store.environment:SANDBOX}") Environment environment,
      @Value("${apple.store.app-apple-id:}") String appAppleId,
      @Value("${apple.store.root-certificate-paths:}") String rootCertificatePaths)
      throws IOException {
    Set<InputStream> rootCertificates = new HashSet<>();
    for (String rootCertificatePath : rootCertificatePaths.split(",")) {
      String trimmedPath = rootCertificatePath.trim();
      if (!trimmedPath.isEmpty()) {
        rootCertificates.add(Files.newInputStream(Path.of(trimmedPath)));
      }
    }

    Long parsedAppAppleId = appAppleId.isBlank() ? null : Long.valueOf(appAppleId);
    /*
     *
     *environmentの本番ではPRODUCTIONにして環境変数として登録する必要がある
     *
     *
     */
    return new SignedDataVerifier(rootCertificates, bundleId, parsedAppAppleId, environment, true);
  }
}
