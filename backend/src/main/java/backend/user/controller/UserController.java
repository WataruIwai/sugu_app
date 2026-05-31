package backend.user.controller;

import backend.dictionary.util.SearchContext;
import backend.user.service.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/user", "/user"})
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
