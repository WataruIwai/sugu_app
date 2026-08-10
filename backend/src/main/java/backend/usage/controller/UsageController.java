package backend.usage.controller;

import backend.dictionary.util.SearchContext;
import backend.exception.UnauthorizedException;
import backend.usage.service.UsageService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/usage", "/api/usage"})
public class UsageController {
  private final UsageService usageService;

  public UsageController(UsageService usageService) {
    this.usageService = usageService;
  }

  @PostMapping("/bonus")
  public void addUsageBonus(@AuthenticationPrincipal SearchContext searchContext) {
    if (searchContext.getUserId() != null) {
      Long userId = searchContext.getUserId();
      usageService.addBonusSearchCountToUser(userId);
    } else {
      throw new UnauthorizedException("Authentication required");
    }
  }
}
