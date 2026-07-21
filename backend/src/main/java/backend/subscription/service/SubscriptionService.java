package backend.subscription.service;

import backend.exception.NotFoundException;
import backend.subscription.repository.SubscriptionRepository;
import backend.subscription.util.ValidatePurchase;
import backend.user.domain.User;
import backend.user.repository.UserRepository;
import com.apple.itunes.storekit.client.APIException;
import com.apple.itunes.storekit.client.AppStoreServerAPIClient;
import com.apple.itunes.storekit.model.Data;
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
  private final AppStoreServerAPIClient client;
  private final SignedDataVerifier signedDataVerifier;
  private final UserRepository userRepository;
  private final ValidatePurchase validatePurchase;

  public SubscriptionService(
      SubscriptionRepository subscriptionRepository,
      AppStoreServerAPIClient client,
      SignedDataVerifier signedDataVerifier,
      UserRepository userRepository,
      ValidatePurchase validatePurchase) {
    this.subscriptionRepository = subscriptionRepository;
    this.client = client;
    this.signedDataVerifier = signedDataVerifier;
    this.userRepository = userRepository;
    this.validatePurchase = validatePurchase;
  }

  public UUID getOrCreateAppAccountToken(long userId) {
    UUID appAccountToken = UUID.randomUUID();
    return subscriptionRepository.setAppAccountTokenIfAbsent(userId, appAccountToken);
  }

  public boolean verifySubscriptionPurchase(long userId, String transactionId)
      throws APIException, IOException, VerificationException {
    TransactionInfoResponse response = client.getTransactionInfo(transactionId);
    String signedTransactionInfo = response.getSignedTransactionInfo();
    JWSTransactionDecodedPayload transaction =
        signedDataVerifier.verifyAndDecodeTransaction(signedTransactionInfo);

    User user = userRepository.getUser(userId);

    validatePurchase.execute(transaction, user);

    subscriptionRepository.upsertPurchaseRecord(transaction, user);
    return subscriptionRepository.isActive(user.getId());
  }

  public void handleAppleNotification(String signedPayload) throws VerificationException {
    ResponseBodyV2DecodedPayload decodedPayload =
        signedDataVerifier.verifyAndDecodeNotification(signedPayload);
    Data notificationData = decodedPayload.getData();
    String signedTransactionInfo = notificationData.getSignedTransactionInfo();
    JWSTransactionDecodedPayload transaction =
        signedDataVerifier.verifyAndDecodeTransaction(signedTransactionInfo);
    User user = userRepository.getUserByAppAccountToken(transaction.getAppAccountToken());
    if (user == null) {
      throw new NotFoundException("User not found for appAccountToken");
    }
    subscriptionRepository.upsertPurchaseRecord(transaction, user);
  }
}
