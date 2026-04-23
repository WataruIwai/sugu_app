package backend.auth.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.auth.dto.AuthRequest;
import backend.auth.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signin")
    public String signIn(@RequestBody AuthRequest request) {
        logger.info("POST /auth/signin received. email={}", request.getInputMail());
        String token = authService.signIn(request.getInputMail(), request.getInputPassword());
        logger.info("POST /auth/signin succeeded. email={}", request.getInputMail());
        return token;
    }

    @PostMapping("/signup")
    public String signUp(@RequestBody AuthRequest request) {
        logger.info("POST /auth/signup received. email={}", request.getInputMail());
        String token = authService.signUp(request.getInputMail(), request.getInputPassword(), request.isAgreedToTerms());
        logger.info("POST /auth/signup succeeded. email={}", request.getInputMail());
        return token;
    }
}
