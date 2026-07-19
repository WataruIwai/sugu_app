package backend.subscription.service;

import backend.subscription.repository.SubscriptionRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionService {
  private final SubscriptionRepository subscriptionRepository;

  public SubscriptionService(SubscriptionRepository subscriptionRepository) {
    this.subscriptionRepository = subscriptionRepository;
  }

  public UUID getOrCreateAppAccountToken(long userId) {
    UUID appAccountToken = UUID.randomUUID();
    return subscriptionRepository.setAppAccountTokenIfAbsent(userId, appAccountToken);
  }
}
