package backend.usage.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.auth.jwt.JwtService;
import backend.dictionary.util.SearchContext;
import backend.exception.UnauthorizedException;
import backend.usage.service.UsageService;

@RestController
@RequestMapping("/api/usage")
public class UsageController {
    private final UsageService usageService;
    private final JwtService jwtService;

    public UsageController(UsageService usageService, JwtService jwtService) {
        this.usageService = usageService;
        this.jwtService = jwtService;
    }

    @PostMapping("/bonus")
    public void addUsageBonus(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Guest-Id", required = false) String guestId) {
        if(authorizationHeader != null) {
            String token = authorizationHeader.replace("Bearer ", "");
            Long userId = jwtService.extractUserId(token);
            SearchContext searchContext = SearchContext.forUser(userId);
            usageService.addBonusSearchCountToUser(searchContext.getUserId());
        } else if( guestId != null) {
            SearchContext searchContext = SearchContext.forGuest(guestId);
            usageService.addBonusSearchCountToGuest(searchContext.getGuestId());
        } else {
            throw new UnauthorizedException("Authentication required");
        }
    }
}



