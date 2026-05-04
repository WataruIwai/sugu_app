package backend.auth.service;

import java.time.LocalDateTime;

import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import backend.auth.apple.AppleIdentityTokenVerifier;
import backend.auth.dto.AppleAuthRequest;
import backend.auth.dto.VerifiedAppleUserInfo;
import backend.auth.jwt.JwtService;
import backend.exception.BadRequestException;
import backend.exception.ConflictException;
import backend.exception.UnauthorizedException;
import backend.user.domain.User;
import backend.user.repository.UserRepository;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private UserRepository userRepository;
    private JwtService jwtService;
    private AppleIdentityTokenVerifier appleIdentityTokenVerifier;


    public AuthService(
        UserRepository userRepository,
        JwtService jwtService,
        AppleIdentityTokenVerifier appleIdentityTokenVerifier) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.appleIdentityTokenVerifier = appleIdentityTokenVerifier;
    }

    public String signInWithAppleAuth(AppleAuthRequest appleAuthRequest) {
        logger.info("AuthService.signInWithAppleAuth started. identityTokenPresent={}",
            appleAuthRequest.getIdentityToken() != null && !appleAuthRequest.getIdentityToken().isBlank());

        if (appleAuthRequest.getIdentityToken() == null || appleAuthRequest.getIdentityToken().isBlank()) {
            logger.warn("AuthService.signInWithAppleAuth rejected: identityToken is blank");
            throw new BadRequestException("Identity token is required");
        }

        if (!Boolean.TRUE.equals(appleAuthRequest.getAgreedToTerms())) {
            logger.warn("AuthService.signInWithAppleAuth rejected: terms not agreed");
            throw new BadRequestException("You must agree to the terms");
        }

        VerifiedAppleUserInfo verifiedAppleUserInfo = appleIdentityTokenVerifier.execute(appleAuthRequest.getIdentityToken());

        User user = userRepository.getUserByProviderUserId(verifiedAppleUserInfo.getSub());

        if (user == null) {
            user = new User(verifiedAppleUserInfo.getEmail(), "apple", verifiedAppleUserInfo.getSub(), "v1", LocalDateTime.now());
            long userId = userRepository.createUserWithAppleId(user);
            String token = jwtService.generateToken(userId);
            return token;
        }

        String token = jwtService.generateToken(user.getId());
        return token;
    }

}
