package backend.subscription.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import backend.exception.NotFoundException;
import backend.subscription.repository.SubscriptionRepository;
import backend.subscription.util.ValidatePurchase;
import backend.user.domain.User;
import backend.user.repository.UserRepository;
import com.apple.itunes.storekit.client.AppStoreServerAPIClient;
import com.apple.itunes.storekit.model.Data;
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
  @Mock private AppStoreServerAPIClient client;
  @Mock private SignedDataVerifier signedDataVerifier;
  @Mock private UserRepository userRepository;

  private SubscriptionService subscriptionService;

  @BeforeEach
  void setUp() {
    subscriptionService =
        new SubscriptionService(
            subscriptionRepository,
            client,
            signedDataVerifier,
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

    when(client.getTransactionInfo("transaction-id")).thenReturn(response);
    when(signedDataVerifier.verifyAndDecodeTransaction("signed-transaction-info"))
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
  void handleAppleNotificationUpsertsPurchaseRecordUsingAppAccountToken() throws Exception {
    UUID appAccountToken = UUID.randomUUID();
    JWSTransactionDecodedPayload transaction = validTransaction(appAccountToken);
    User user = User.fromDb(1L, "test@example.com", "apple", "provider-user-id", appAccountToken);

    when(signedDataVerifier.verifyAndDecodeNotification("signed-payload"))
        .thenReturn(notificationPayload("signed-transaction-info"));
    when(signedDataVerifier.verifyAndDecodeTransaction("signed-transaction-info"))
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

    when(signedDataVerifier.verifyAndDecodeNotification("signed-payload"))
        .thenReturn(notificationPayload("signed-transaction-info"));
    when(signedDataVerifier.verifyAndDecodeTransaction("signed-transaction-info"))
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
