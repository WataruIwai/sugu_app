package backend.subscription.util;

import backend.exception.NotFoundException;
import backend.user.domain.User;
import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ValidatePurchase {
  private final String subscriptionProductId;

  public ValidatePurchase(
      @Value("${apple.store.subscription-product-id}") String subscriptionProductId) {
    this.subscriptionProductId = subscriptionProductId;
  }

  public void execute(JWSTransactionDecodedPayload transaction, User user) {
    if (user == null) {
      throw new NotFoundException("User not found");
    }

    if (!subscriptionProductId.equals(transaction.getProductId())) {
      throw new IllegalStateException("商品が一致しません");
    }

    if (transaction.getAppAccountToken() == null
        || !transaction.getAppAccountToken().equals(user.getAppAccountToken())) {
      throw new IllegalStateException("appAccountTokenが一致しません");
    }

    Long expiresDate = transaction.getExpiresDate();
    if (expiresDate == null || expiresDate <= System.currentTimeMillis()) {
      throw new IllegalStateException("サブスクリプションの有効期限が切れています");
    }

    if (transaction.getRevocationDate() != null) {
      throw new IllegalStateException("購入が取り消されています");
    }
  }
}
