package backend.auth.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.auth.dto.AppleAuthRequest;
import backend.auth.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/apple")
    public String signInWithAppleAuth(@RequestBody AppleAuthRequest request) {
        logger.info("POST /auth/apple received. identityTokenPresent={}",
            request.getIdentityToken() != null && !request.getIdentityToken().isBlank());
        String token = authService.signInWithAppleAuth(request);
        logger.info("POST /auth/apple succeeded");
        return token;
    }
}
