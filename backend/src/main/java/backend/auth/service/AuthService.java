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

    public String signIn(String inputMail, String inputPassword) {
        logger.info("AuthService.signIn started. email={}", inputMail);

        if (inputMail == null || inputMail.isBlank()) {
            logger.warn("AuthService.signIn rejected: email is blank");
            throw new BadRequestException("Email is required");
        }

        if (inputPassword == null || inputPassword.isBlank()) {
            logger.warn("AuthService.signIn rejected: password is blank. email={}", inputMail);
            throw new BadRequestException("Password is required");
        }

        User user = userRepository.getUserByEmail(inputMail);
        logger.info("AuthService.signIn user lookup completed. email={}, userFound={}", inputMail, user != null);

        if (user == null || !BCrypt.checkpw(inputPassword, user.getPasswordHash())) {
            logger.warn("AuthService.signIn failed: invalid credentials. email={}", inputMail);
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId());
        logger.info("AuthService.signIn succeeded. email={}, userId={}", inputMail, user.getId());
        return token;
    }

    public String signUp(String inputMail, String inputPassword, Boolean isAgreedToTerms) {
        logger.info("AuthService.signUp started. email={}", inputMail);

        if (inputMail == null || inputMail.isBlank()) {
            logger.warn("AuthService.signUp rejected: email is blank");
            throw new BadRequestException("Email is required");
        }

        if (inputPassword == null || inputPassword.isBlank()) {
            logger.warn("AuthService.signUp rejected: password is blank. email={}", inputMail);
            throw new BadRequestException("Password is required");
        }

        if (!Boolean.TRUE.equals(isAgreedToTerms)) {
            logger.warn("AuthService.signUp rejected: terms not agreed. email={}", inputMail);
            throw new BadRequestException("You must agree to the terms");
        }

        User user = userRepository.getUserByEmail(inputMail);
        if(user != null) {
            logger.warn("AuthService.signUp rejected: account already exists. email={}", inputMail);
            throw new ConflictException("Account already exists");
        }

        String termsVersion = "v1";
        LocalDateTime agreedTermsAt = LocalDateTime.now();

        String hashedPassword = BCrypt.hashpw(inputPassword, BCrypt.gensalt());
        User newUser = new User(inputMail, hashedPassword, termsVersion, agreedTermsAt);
        userRepository.createUser(newUser);
        logger.info("AuthService.signUp created user record. email={}", inputMail);

        User createdUser = userRepository.getUserByEmail(inputMail);
        String token = jwtService.generateToken(createdUser.getId());
        logger.info("AuthService.signUp succeeded. email={}, userId={}", inputMail, createdUser.getId());
        return token;
    }

    public String signInWithAppleAuth(AppleAuthRequest appleAuthRequest) {
        logger.info("AuthService.signInWithAppleAuth started. identityToken={}", appleAuthRequest.getIdentityToken());

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
