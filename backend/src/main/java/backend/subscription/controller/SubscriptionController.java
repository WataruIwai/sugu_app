package backend.subscription.controller;

import backend.dictionary.util.SearchContext;
import backend.subscription.dto.AppleNotificationRequest;
import backend.subscription.service.SubscriptionService;
import com.apple.itunes.storekit.client.APIException;
import com.apple.itunes.storekit.verification.VerificationException;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

  @PostMapping("/verify")
  public SubscriptionStatusResponse verify(
      @AuthenticationPrincipal SearchContext searchContext, @RequestParam String transactionId)
      throws APIException, IOException, VerificationException {
    long userId = searchContext.getUserId();
    boolean isActive = subscriptionService.verifySubscriptionPurchase(userId, transactionId);
    if (!isActive) throw new IllegalStateException("");
    return new SubscriptionStatusResponse("ACTIVE");
  }

  @GetMapping("/status")
  public SubscriptionStatusResponse status(@AuthenticationPrincipal SearchContext searchContext) {
    long userId = searchContext.getUserId();
    boolean isActive = subscriptionService.isSubscriptionActive(userId);
    return new SubscriptionStatusResponse(isActive ? "ACTIVE" : "INACTIVE");
  }

  @PostMapping("/notifications/apple")
  public ResponseEntity<Void> receiveAppleNotification(@RequestBody AppleNotificationRequest request)
      throws VerificationException {
    subscriptionService.handleAppleNotification(request.signedPayload());
    return ResponseEntity.ok().build();
  }

  public record AppAccountTokenResponse(UUID appAccountToken) {}

  public record SubscriptionStatusResponse(String status) {}
}
