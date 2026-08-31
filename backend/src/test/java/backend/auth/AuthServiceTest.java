package backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import backend.auth.apple.AppleIdentityTokenVerifier;
import backend.auth.dto.AppleAuthRequest;
import backend.auth.dto.GoogleAccountInfo;
import backend.auth.dto.GoogleAuthRequest;
import backend.auth.dto.VerifiedAppleUserInfo;
import backend.auth.google.GoogleIdentityTokenVerifier;
import backend.auth.jwt.JwtService;
import backend.auth.service.AuthService;
import backend.exception.BadRequestException;
import backend.user.domain.User;
import backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
  @Mock private UserRepository userRepository;
  @Mock private JwtService jwtService;
  @Mock private AppleIdentityTokenVerifier appleIdentityTokenVerifier;
  @Mock private GoogleIdentityTokenVerifier googleIdentityTokenVerifier;

  @InjectMocks private AuthService authService;

  AppleAuthRequest request = new AppleAuthRequest("identityToken", "nonceHash", true);

  @Test
  void createUserAndReturnTokenWhenAppleUserDoesNotExist() {
    when(appleIdentityTokenVerifier.execute("identityToken", "nonceHash"))
        .thenReturn(new VerifiedAppleUserInfo("sub", "email"));
    when(userRepository.getUserByAuthProviderAndProviderUserId("apple", "sub")).thenReturn(null);

    // Codex: 新規ユーザー作成後にJWT発行まで進めるためのmock設定です。
    when(userRepository.createOAuthUser(any(User.class))).thenReturn(1L);
    when(jwtService.generateToken(1L)).thenReturn("jwt-token");

    // Codex: AuthServiceのhappy pathを実行しています。
    String token = authService.signInWithAppleAuth(request);

    // Codex: 戻り値と、新規ユーザー作成が呼ばれたことを確認しています。
    assertEquals("jwt-token", token);
    verify(userRepository).createOAuthUser(any(User.class));
    verify(jwtService).generateToken(1L);
  }

  @Test
  void returnTokenWhenAppleUserExist() {
    when(appleIdentityTokenVerifier.execute("identityToken", "nonceHash"))
        .thenReturn(new VerifiedAppleUserInfo("sub", "email"));
    when(userRepository.getUserByAuthProviderAndProviderUserId("apple", "sub"))
        .thenReturn(User.fromDb(1L, "email", "apple", "sub", null));
    when(jwtService.generateToken(1L)).thenReturn("jwt-token");

    String token = authService.signInWithAppleAuth(request);

    assertEquals("jwt-token", token);
    verify(userRepository, never()).createOAuthUser(any(User.class));
    verify(jwtService).generateToken(1L);
  }

  @Test
  void createUserAndReturnTokenWhenGoogleUserDoesNotExist() {
    GoogleAuthRequest request = new GoogleAuthRequest("google-id-token", true);
    when(googleIdentityTokenVerifier.verify("google-id-token"))
        .thenReturn(new GoogleAccountInfo("google-sub", "google@example.com"));
    when(userRepository.getUserByAuthProviderAndProviderUserId("google", "google-sub"))
        .thenReturn(null);
    when(userRepository.createOAuthUser(any(User.class))).thenReturn(10L);
    when(jwtService.generateToken(10L)).thenReturn("google-jwt-token");

    String token = authService.signInWithGoogleAuth(request);

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
    assertEquals("google-jwt-token", token);
    verify(userRepository).createOAuthUser(userCaptor.capture());
    User createdUser = userCaptor.getValue();
    assertEquals("google@example.com", createdUser.getEmail());
    assertEquals("google", createdUser.getAuthProvider());
    assertEquals("google-sub", createdUser.getProviderUserId());
    assertEquals("v1", createdUser.getTermsVersion());
    verify(jwtService).generateToken(10L);
  }

  @Test
  void returnTokenWhenGoogleUserExists() {
    GoogleAuthRequest request = new GoogleAuthRequest("google-id-token", true);
    when(googleIdentityTokenVerifier.verify("google-id-token"))
        .thenReturn(new GoogleAccountInfo("google-sub", "google@example.com"));
    when(userRepository.getUserByAuthProviderAndProviderUserId("google", "google-sub"))
        .thenReturn(User.fromDb(11L, "google@example.com", "google", "google-sub", null));
    when(jwtService.generateToken(11L)).thenReturn("existing-google-jwt-token");

    String token = authService.signInWithGoogleAuth(request);

    assertEquals("existing-google-jwt-token", token);
    verify(userRepository, never()).createOAuthUser(any(User.class));
    verify(jwtService).generateToken(11L);
  }

  @Test
  void rejectGoogleAuthWhenIdentityTokenIsBlank() {
    GoogleAuthRequest request = new GoogleAuthRequest(" ", true);

    BadRequestException exception =
        assertThrows(BadRequestException.class, () -> authService.signInWithGoogleAuth(request));

    assertEquals("Identity token is required", exception.getMessage());
    verify(googleIdentityTokenVerifier, never()).verify(any());
    verify(userRepository, never()).createOAuthUser(any(User.class));
  }

  @Test
  void rejectGoogleAuthWhenTermsAreNotAgreed() {
    GoogleAuthRequest request = new GoogleAuthRequest("google-id-token", false);

    BadRequestException exception =
        assertThrows(BadRequestException.class, () -> authService.signInWithGoogleAuth(request));

    assertEquals("You must agree to the terms", exception.getMessage());
    verify(googleIdentityTokenVerifier, never()).verify(any());
    verify(userRepository, never()).createOAuthUser(any(User.class));
  }
}
