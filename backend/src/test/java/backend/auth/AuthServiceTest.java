package backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import backend.auth.apple.AppleIdentityTokenVerifier;
import backend.auth.dto.AppleAuthRequest;
import backend.auth.dto.VerifiedAppleUserInfo;
import backend.auth.jwt.JwtService;
import backend.auth.service.AuthService;
import backend.user.domain.User;
import backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
  @Mock private UserRepository userRepository;
  @Mock private JwtService jwtService;
  @Mock private AppleIdentityTokenVerifier appleIdentityTokenVerifier;

  @InjectMocks private AuthService authService;

  AppleAuthRequest request = new AppleAuthRequest("identityToken", "nonceHash", true);

  @Test
  void createUserAndReturnTokenWhenAppleUserDoesNotExist() {
    when(appleIdentityTokenVerifier.execute("identityToken", "nonceHash"))
        .thenReturn(new VerifiedAppleUserInfo("sub", "email"));
    when(userRepository.getUserByProviderUserId("sub")).thenReturn(null);

    // Codex: 新規ユーザー作成後にJWT発行まで進めるためのmock設定です。
    when(userRepository.createUserWithAppleId(any(User.class))).thenReturn(1L);
    when(jwtService.generateToken(1L)).thenReturn("jwt-token");

    // Codex: AuthServiceのhappy pathを実行しています。
    String token = authService.signInWithAppleAuth(request);

    // Codex: 戻り値と、新規ユーザー作成が呼ばれたことを確認しています。
    assertEquals("jwt-token", token);
    verify(userRepository).createUserWithAppleId(any(User.class));
    verify(jwtService).generateToken(1L);
  }

  @Test
  void returnTokenWhenAppleUserExist() {
    when(appleIdentityTokenVerifier.execute("identityToken", "nonceHash"))
        .thenReturn(new VerifiedAppleUserInfo("sub", "email"));
    when(userRepository.getUserByProviderUserId("sub"))
        .thenReturn(User.fromDb(1L, "email", "apple", "sub", null));
    when(jwtService.generateToken(1L)).thenReturn("jwt-token");

    String token = authService.signInWithAppleAuth(request);

    assertEquals("jwt-token", token);
    verify(userRepository, never()).createUserWithAppleId(any(User.class));
    verify(jwtService).generateToken(1L);
  }
}
