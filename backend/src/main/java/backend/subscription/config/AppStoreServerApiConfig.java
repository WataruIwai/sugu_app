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
  public AppStoreServerServices appStoreServerServices(
      @Value("${apple.store.private-key-path}") String privateKeyPath,
      @Value("${apple.store.key-id}") String keyId,
      @Value("${apple.store.issuer-id}") String issuerId,
      @Value("${apple.store.bundle-id}") String bundleId,
      @Value("${apple.store.environment:SANDBOX}") Environment environment,
      @Value("${apple.store.app-apple-id:}") String appAppleId,
      @Value("${apple.store.root-certificate-paths:}") String rootCertificatePaths)
      throws IOException {
    String privateKey = Files.readString(Path.of(privateKeyPath));
    Long parsedAppAppleId = appAppleId.isBlank() ? null : Long.valueOf(appAppleId);
    return new AppStoreServerServices(
        environment,
        new AppStoreServerAPIClient(
            privateKey, keyId, issuerId, bundleId, Environment.PRODUCTION),
        new SignedDataVerifier(
            rootCertificates(rootCertificatePaths),
            bundleId,
            parsedAppAppleId,
            Environment.PRODUCTION,
            true),
        new AppStoreServerAPIClient(privateKey, keyId, issuerId, bundleId, Environment.SANDBOX),
        new SignedDataVerifier(
            rootCertificates(rootCertificatePaths),
            bundleId,
            parsedAppAppleId,
            Environment.SANDBOX,
            true));
  }

  private Set<InputStream> rootCertificates(String rootCertificatePaths) throws IOException {
    Set<InputStream> rootCertificates = new HashSet<>();
    for (String rootCertificatePath : rootCertificatePaths.split(",")) {
      String trimmedPath = rootCertificatePath.trim();
      if (!trimmedPath.isEmpty()) {
        rootCertificates.add(Files.newInputStream(Path.of(trimmedPath)));
      }
    }
    return rootCertificates;
  }

  public record AppStoreServerServices(
      Environment preferredEnvironment,
      AppStoreServerAPIClient productionClient,
      SignedDataVerifier productionVerifier,
      AppStoreServerAPIClient sandboxClient,
      SignedDataVerifier sandboxVerifier) {}
}
