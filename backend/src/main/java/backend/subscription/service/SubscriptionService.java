package backend.subscription.service;

import backend.exception.NotFoundException;
import backend.subscription.config.AppStoreServerApiConfig.AppStoreServerServices;
import backend.subscription.repository.SubscriptionRepository;
import backend.subscription.util.ValidatePurchase;
import backend.user.domain.User;
import backend.user.repository.UserRepository;
import com.apple.itunes.storekit.client.APIError;
import com.apple.itunes.storekit.client.APIException;
import com.apple.itunes.storekit.client.AppStoreServerAPIClient;
import com.apple.itunes.storekit.model.Data;
import com.apple.itunes.storekit.model.Environment;
import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import com.apple.itunes.storekit.model.ResponseBodyV2DecodedPayload;
import com.apple.itunes.storekit.model.TransactionInfoResponse;
import com.apple.itunes.storekit.verification.SignedDataVerifier;
import com.apple.itunes.storekit.verification.VerificationException;
import java.io.IOException;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionService {
  private final SubscriptionRepository subscriptionRepository;
  private final AppStoreServerServices appStoreServerServices;
  private final UserRepository userRepository;
  private final ValidatePurchase validatePurchase;

  public SubscriptionService(
      SubscriptionRepository subscriptionRepository,
      AppStoreServerServices appStoreServerServices,
      UserRepository userRepository,
      ValidatePurchase validatePurchase) {
    this.subscriptionRepository = subscriptionRepository;
    this.appStoreServerServices = appStoreServerServices;
    this.userRepository = userRepository;
    this.validatePurchase = validatePurchase;
  }

  public UUID getOrCreateAppAccountToken(long userId) {
    UUID appAccountToken = UUID.randomUUID();
    return subscriptionRepository.setAppAccountTokenIfAbsent(userId, appAccountToken);
  }

  public boolean verifySubscriptionPurchase(long userId, String transactionId)
      throws APIException, IOException, VerificationException {
    JWSTransactionDecodedPayload transaction = fetchAndVerifyTransaction(transactionId);

    User user = userRepository.getUser(userId);

    validatePurchase.execute(transaction, user);

    subscriptionRepository.upsertPurchaseRecord(transaction, user);
    return subscriptionRepository.isActive(user.getId());
  }

  public boolean isSubscriptionActive(long userId) {
    return subscriptionRepository.isActive(userId);
  }

  public void handleAppleNotification(String signedPayload) throws VerificationException {
    ResponseBodyV2DecodedPayload decodedPayload =
        verifierFor(appStoreServerServices.preferredEnvironment())
            .verifyAndDecodeNotification(signedPayload);
    Data notificationData = decodedPayload.getData();
    String signedTransactionInfo = notificationData.getSignedTransactionInfo();
    JWSTransactionDecodedPayload transaction =
        verifierFor(appStoreServerServices.preferredEnvironment())
            .verifyAndDecodeTransaction(signedTransactionInfo);
    User user = userRepository.getUserByAppAccountToken(transaction.getAppAccountToken());
    if (user == null) {
      throw new NotFoundException("User not found for appAccountToken");
    }
    subscriptionRepository.upsertPurchaseRecord(transaction, user);
  }

  private JWSTransactionDecodedPayload fetchAndVerifyTransaction(String transactionId)
      throws APIException, IOException, VerificationException {
    Environment preferredEnvironment = appStoreServerServices.preferredEnvironment();
    try {
      return fetchAndVerifyTransaction(transactionId, preferredEnvironment);
    } catch (APIException e) {
      if (!isTransactionNotFound(e)) {
        throw e;
      }
      return fetchAndVerifyTransaction(transactionId, fallbackEnvironment(preferredEnvironment));
    }
  }

  private JWSTransactionDecodedPayload fetchAndVerifyTransaction(
      String transactionId, Environment environment)
      throws APIException, IOException, VerificationException {
    TransactionInfoResponse response = clientFor(environment).getTransactionInfo(transactionId);
    return verifierFor(environment).verifyAndDecodeTransaction(response.getSignedTransactionInfo());
  }

  private AppStoreServerAPIClient clientFor(Environment environment) {
    return environment == Environment.PRODUCTION
        ? appStoreServerServices.productionClient()
        : appStoreServerServices.sandboxClient();
  }

  private SignedDataVerifier verifierFor(Environment environment) {
    return environment == Environment.PRODUCTION
        ? appStoreServerServices.productionVerifier()
        : appStoreServerServices.sandboxVerifier();
  }

  private Environment fallbackEnvironment(Environment environment) {
    return environment == Environment.PRODUCTION ? Environment.SANDBOX : Environment.PRODUCTION;
  }

  private boolean isTransactionNotFound(APIException e) {
    return e.getApiError() == APIError.TRANSACTION_ID_NOT_FOUND;
  }
}
