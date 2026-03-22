package backend.user.service;

import backend.user.domain.User;
import backend.user.repository.UserRepository;

public class UserService {
    private UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUser(long userId) {
        return userRepository.getUser(userId);
    }

    public User getUserByEmail(String email) {
        return userRepository.getUserByEmail(email);
    }

    public void createUser(User newUser) {
        userRepository.createUser(newUser);
    }
}
