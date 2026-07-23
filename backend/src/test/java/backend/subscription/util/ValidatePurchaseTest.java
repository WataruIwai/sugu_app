package backend.subscription.util;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import backend.user.domain.User;
import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ValidatePurchaseTest {
  private static final String PRODUCT_ID = "com.sugu.pro.monthly";

  private final ValidatePurchase validatePurchase = new ValidatePurchase(PRODUCT_ID);

  @Test
  void allowValidPurchase() {
    UUID appAccountToken = UUID.randomUUID();
    User user = User.fromDb(1L, "test@example.com", "apple", "provider-user-id", appAccountToken);
    JWSTransactionDecodedPayload transaction = validTransaction(appAccountToken);

    assertDoesNotThrow(() -> validatePurchase.execute(transaction, user));
  }

  @Test
  void rejectPurchaseWhenAppAccountTokenDoesNotMatch() {
    User user =
        User.fromDb(1L, "test@example.com", "apple", "provider-user-id", UUID.randomUUID());
    JWSTransactionDecodedPayload transaction = validTransaction(UUID.randomUUID());

    assertThrows(IllegalStateException.class, () -> validatePurchase.execute(transaction, user));
  }

  @Test
  void rejectPurchaseWhenProductIdDoesNotMatch() {
    UUID appAccountToken = UUID.randomUUID();
    User user = User.fromDb(1L, "test@example.com", "apple", "provider-user-id", appAccountToken);
    JWSTransactionDecodedPayload transaction = validTransaction(appAccountToken);
    transaction.setProductId("com.sugu.other");

    assertThrows(IllegalStateException.class, () -> validatePurchase.execute(transaction, user));
  }

  @Test
  void rejectExpiredPurchase() {
    UUID appAccountToken = UUID.randomUUID();
    User user = User.fromDb(1L, "test@example.com", "apple", "provider-user-id", appAccountToken);
    JWSTransactionDecodedPayload transaction = validTransaction(appAccountToken);
    transaction.setExpiresDate(System.currentTimeMillis() - 1_000L);

    assertThrows(IllegalStateException.class, () -> validatePurchase.execute(transaction, user));
  }

  private JWSTransactionDecodedPayload validTransaction(UUID appAccountToken) {
    JWSTransactionDecodedPayload transaction = new JWSTransactionDecodedPayload();
    transaction.setProductId(PRODUCT_ID);
    transaction.setAppAccountToken(appAccountToken);
    transaction.setExpiresDate(System.currentTimeMillis() + 86_400_000L);
    transaction.setRevocationDate(null);
    return transaction;
  }
}
