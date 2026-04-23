package backend.user.service;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;

import backend.exception.BadRequestException;
import backend.exception.ConflictException;
import backend.exception.NotFoundException;
import backend.user.domain.User;
import backend.user.repository.UserRepository;

@Service
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

    public void updateUserEmail(long userId, String email) {
        User existing = userRepository.getUserByEmail(email);
        if (existing != null) {
            throw new ConflictException("Email already in use");
        }
        userRepository.updateUserMail(userId, email);
    }

    public void updateUserPassword(long userId, String currentPassword, String newPassword) {
        User user = userRepository.getUser(userId);
        if (user == null) {
            throw new NotFoundException("User not found");
        }
        if (!BCrypt.checkpw(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        String hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt());
        userRepository.updateUserPassword(userId, hashedPassword);
    }

    public void deleteUser(long userId) {
        User user = userRepository.getUser(userId);
        if (user == null) {
            throw new NotFoundException("User not found");
        }

        userRepository.deleteUser(userId);
    }
}
