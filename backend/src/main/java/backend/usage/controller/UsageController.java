package backend.usage.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.dictionary.util.SearchContext;
import backend.exception.UnauthorizedException;
import backend.usage.service.UsageService;

@RestController
@RequestMapping("/api/usage")
public class UsageController {
    private final UsageService usageService;

    public UsageController(UsageService usageService) {
        this.usageService = usageService;
    }

    @PostMapping("/bonus")
    public void addUsageBonus(@AuthenticationPrincipal SearchContext searchContext) {
        if(searchContext.getUserId() != null) {
            Long userId = searchContext.getUserId();
            usageService.addBonusSearchCountToUser(userId);
        } else if(searchContext.getGuestId() != null) {
            usageService.addBonusSearchCountToGuest(searchContext.getGuestId());
        } else {
            throw new UnauthorizedException("Authentication required");
        }
    }
}



