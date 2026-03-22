package backend.auth.controller;

import backend.auth.service.AuthService;

public class AuthController {
    private AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public String signIn(String inputMail, String inputPassword) {
        String token = authService.signIn(inputMail, inputPassword);
        if(token == null) {
            throw new RuntimeException("ログインに失敗しました");
        }
        return token;
    }

    public String signUp(String inputMail, String inputPassword) {
        String token = authService.signUp(inputMail, inputPassword);
        if(token == null) {
            throw new RuntimeException("ユーザー登録に失敗しました");
        }
        return token;
    }
}
