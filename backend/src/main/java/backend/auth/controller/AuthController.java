package backend.auth.controller;

import backend.auth.service.AuthService;

public class AuthController {
    private AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public void signIn(String inputMail, String inputPassword) {
        boolean result = authService.signIn(inputMail, inputPassword);
        if(result) {
            System.out.println("ログインに成功しました");
        } else {
            throw new RuntimeException("ログインに失敗しました");
        }
    }

    public void signUp(String inputMail, String inputPassword) {
        boolean result = authService.signUp(inputMail, inputPassword);
        if(!result) throw new RuntimeException("ユーザー登録に失敗しました");
    }
}
