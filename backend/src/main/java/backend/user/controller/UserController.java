package backend.user.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import backend.auth.jwt.JwtService;
import backend.user.dto.UpdateEmailRequest;
import backend.user.dto.UpdatePasswordRequest;
import backend.user.service.UserService;

@RestController
@RequestMapping("/user")
public class UserController {
    private UserService userService;
    private JwtService jwtService;

    public UserController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/email")
    public void updateEmail(
        @RequestBody UpdateEmailRequest request,
        @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtService.extractUserId(token);

        userService.updateUserEmail(userId, request.getEmail());
    }

    @PostMapping("/password")
    public void updatePassword(
        @RequestBody UpdatePasswordRequest request,
        @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtService.extractUserId(token);
        userService.updateUserPassword(userId, request.getCurrentPassword(), request.getNewPassword());
    }

    @DeleteMapping
    public void deleteUser(
        @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtService.extractUserId(token);
        userService.deleteUser(userId);
    }
}
