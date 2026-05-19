package backend.user.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.dictionary.util.SearchContext;
import backend.user.service.UserService;

@RestController
@RequestMapping("/user")
public class UserController {
    private UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @DeleteMapping
    public void deleteUser(@AuthenticationPrincipal SearchContext searchContext) {
        Long userId = searchContext.getUserId();
        userService.deleteUser(userId);
    }
}
