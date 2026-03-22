package backend.auth.service;

import org.mindrot.jbcrypt.BCrypt;

import backend.user.domain.User;
import backend.user.repository.UserRepository;

public class AuthService {
    private UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    //ログイン(Sign in)
    public boolean signIn(String inputMail, String inputPassword) {
        if(inputMail.isBlank() || inputPassword.isBlank()) return false;
        User user = userRepository.getUserByEmail(inputMail);
        if(user == null) {
            return false;
        }
        Boolean isSignIn = BCrypt.checkpw(inputPassword, user.getPasswordHash());
        if(!isSignIn) {
            return false;
        }
        return true;
    }
    //新規ユーザー作成(Sign up)
    public boolean signUp(String inputMail, String inputPassword) {
        if(inputMail.isBlank() || inputPassword.isBlank()) return false;
        User user = userRepository.getUserByEmail(inputMail);
        if(user == null) {
            String hashedPassword = BCrypt.hashpw(inputPassword, BCrypt.gensalt());
            User newUser = new User(inputMail, hashedPassword);
            userRepository.createUser(newUser);
            return true;
        }
        return false;
    }
}
