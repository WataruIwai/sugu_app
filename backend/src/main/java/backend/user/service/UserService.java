package backend.user.service;

import backend.exception.NotFoundException;
import backend.user.domain.User;
import backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {
  private UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User getUser(long userId) {
    return userRepository.getUser(userId);
  }

  public void deleteUser(long userId) {
    User user = userRepository.getUser(userId);
    if (user == null) {
      throw new NotFoundException("User not found");
    }

    userRepository.deleteUser(userId);
  }
}
