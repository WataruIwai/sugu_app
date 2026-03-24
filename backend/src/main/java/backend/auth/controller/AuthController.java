package backend.auth.controller;

import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.auth.dto.AuthRequest;
import backend.auth.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signin")
    public String signIn(@RequestBody AuthRequest request) {
        String token = authService.signIn(request.getInputMail(), request.getInputPassword());
        if(token == null) {
            throw new RuntimeException("ログインに失敗しました");
        }
        return token;
    }

    @PostMapping("/signup")
    public String signUp(@RequestBody AuthRequest request) {
        String token = authService.signUp(request.getInputMail(), request.getInputPassword());
        if(token == null) {
            throw new RuntimeException("ユーザー登録に失敗しました");
        }
        return token;
    }
}
