package backend.subscription.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {
  private static final String PRODUCT_ID = "com.sugu.pro.monthly";

  @Mock private SubscriptionRepository subscriptionRepository;
  @Mock private AppStoreServerAPIClient productionClient;
  @Mock private SignedDataVerifier productionVerifier;
  @Mock private AppStoreServerAPIClient sandboxClient;
  @Mock private SignedDataVerifier sandboxVerifier;
  @Mock private UserRepository userRepository;

  private SubscriptionService subscriptionService;

  @BeforeEach
  void setUp() {
    subscriptionService =
        new SubscriptionService(
            subscriptionRepository,
            new AppStoreServerServices(
                Environment.PRODUCTION,
                productionClient,
                productionVerifier,
                sandboxClient,
                sandboxVerifier),
            userRepository,
            new ValidatePurchase(PRODUCT_ID));
  }

  @Test
  void verifySubscriptionPurchaseDoesNotUpsertWhenAppAccountTokenDoesNotMatch()
      throws Exception {
    long userId = 1L;
    UUID userAppAccountToken = UUID.randomUUID();
    JWSTransactionDecodedPayload transaction = validTransaction(UUID.randomUUID());
    TransactionInfoResponse response = new TransactionInfoResponse();
    response.setSignedTransactionInfo("signed-transaction-info");

    when(productionClient.getTransactionInfo("transaction-id")).thenReturn(response);
    when(productionVerifier.verifyAndDecodeTransaction("signed-transaction-info"))
        .thenReturn(transaction);
    when(userRepository.getUser(userId))
        .thenReturn(
            User.fromDb(
                userId, "test@example.com", "apple", "provider-user-id", userAppAccountToken));

    assertThrows(
        IllegalStateException.class,
        () -> subscriptionService.verifySubscriptionPurchase(userId, "transaction-id"));

    verify(subscriptionRepository, never())
        .upsertPurchaseRecord(any(JWSTransactionDecodedPayload.class), any());
  }

  @Test
  void verifySubscriptionPurchaseFallsBackToSandboxWhenProductionTransactionIsNotFound()
      throws Exception {
    long userId = 1L;
    UUID appAccountToken = UUID.randomUUID();
    JWSTransactionDecodedPayload transaction = validTransaction(appAccountToken);
    TransactionInfoResponse response = new TransactionInfoResponse();
    response.setSignedTransactionInfo("signed-transaction-info");
    User user = User.fromDb(1L, "test@example.com", "apple", "provider-user-id", appAccountToken);

    when(productionClient.getTransactionInfo("transaction-id"))
        .thenThrow(new APIException(404, APIError.TRANSACTION_ID_NOT_FOUND, "not found"));
    when(sandboxClient.getTransactionInfo("transaction-id")).thenReturn(response);
    when(sandboxVerifier.verifyAndDecodeTransaction("signed-transaction-info"))
        .thenReturn(transaction);
    when(userRepository.getUser(userId)).thenReturn(user);
    when(subscriptionRepository.isActive(userId)).thenReturn(true);

    subscriptionService.verifySubscriptionPurchase(userId, "transaction-id");

    verify(sandboxClient).getTransactionInfo("transaction-id");
    verify(subscriptionRepository).upsertPurchaseRecord(transaction, user);
  }

  @Test
  void handleAppleNotificationUpsertsPurchaseRecordUsingAppAccountToken() throws Exception {
    UUID appAccountToken = UUID.randomUUID();
    JWSTransactionDecodedPayload transaction = validTransaction(appAccountToken);
    User user = User.fromDb(1L, "test@example.com", "apple", "provider-user-id", appAccountToken);

    when(productionVerifier.verifyAndDecodeNotification("signed-payload"))
        .thenReturn(notificationPayload("signed-transaction-info"));
    when(productionVerifier.verifyAndDecodeTransaction("signed-transaction-info"))
        .thenReturn(transaction);
    when(userRepository.getUserByAppAccountToken(appAccountToken)).thenReturn(user);

    subscriptionService.handleAppleNotification("signed-payload");

    verify(userRepository).getUserByAppAccountToken(appAccountToken);
    verify(subscriptionRepository).upsertPurchaseRecord(transaction, user);
  }

  @Test
  void handleAppleNotificationDoesNotUpsertWhenUserIsNotFound() throws Exception {
    UUID appAccountToken = UUID.randomUUID();
    JWSTransactionDecodedPayload transaction = validTransaction(appAccountToken);

    when(productionVerifier.verifyAndDecodeNotification("signed-payload"))
        .thenReturn(notificationPayload("signed-transaction-info"));
    when(productionVerifier.verifyAndDecodeTransaction("signed-transaction-info"))
        .thenReturn(transaction);
    when(userRepository.getUserByAppAccountToken(appAccountToken)).thenReturn(null);

    assertThrows(
        NotFoundException.class, () -> subscriptionService.handleAppleNotification("signed-payload"));

    verify(subscriptionRepository, never())
        .upsertPurchaseRecord(any(JWSTransactionDecodedPayload.class), any());
  }

  private ResponseBodyV2DecodedPayload notificationPayload(String signedTransactionInfo) {
    Data data = new Data();
    data.setSignedTransactionInfo(signedTransactionInfo);

    ResponseBodyV2DecodedPayload payload = new ResponseBodyV2DecodedPayload();
    payload.setData(data);
    return payload;
  }

  private JWSTransactionDecodedPayload validTransaction(UUID appAccountToken) {
    JWSTransactionDecodedPayload transaction = new JWSTransactionDecodedPayload();
    transaction.setOriginalTransactionId("original-transaction-id");
    transaction.setTransactionId("transaction-id");
    transaction.setProductId(PRODUCT_ID);
    transaction.setAppAccountToken(appAccountToken);
    transaction.setExpiresDate(System.currentTimeMillis() + 86_400_000L);
    transaction.setRevocationDate(null);
    return transaction;
  }
}
