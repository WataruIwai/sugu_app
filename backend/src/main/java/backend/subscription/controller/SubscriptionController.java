package backend.subscription.controller;

import backend.dictionary.util.SearchContext;
import backend.subscription.service.SubscriptionService;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/subscription"})
public class SubscriptionController {
  private final SubscriptionService subscriptionService;

  public SubscriptionController(SubscriptionService subscriptionService) {
    this.subscriptionService = subscriptionService;
  }

  @PostMapping("/appAccountToken")
  public AppAccountTokenResponse getOrCreateAppAccountToken(
      @AuthenticationPrincipal SearchContext searchContext) {
    long userId = searchContext.getUserId();
    UUID appAccountToken = subscriptionService.getOrCreateAppAccountToken(userId);
    return new AppAccountTokenResponse(appAccountToken);
  }

  public record AppAccountTokenResponse(UUID appAccountToken) {}
}
