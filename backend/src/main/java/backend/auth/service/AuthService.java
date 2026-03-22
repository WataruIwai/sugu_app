package backend.auth.service;

import org.mindrot.jbcrypt.BCrypt;

import backend.auth.jwt.JwtService;
import backend.user.domain.User;
import backend.user.repository.UserRepository;

public class AuthService {
    private UserRepository userRepository;
    private JwtService jwtService;

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    //ログイン(Sign in)
    public String signIn(String inputMail, String inputPassword) {
        if(inputMail.isBlank() || inputPassword.isBlank()) return null;
        User user = userRepository.getUserByEmail(inputMail);
        if(user == null) throw new RuntimeException("アカウントが見つかりませんでした。");

        boolean isSignIn = BCrypt.checkpw(inputPassword, user.getPasswordHash());
        if(isSignIn) {
            String token = jwtService.generateToken(user.getId());
            return token;
        }
        return null;
    }
    //新規ユーザー作成(Sign up)
    public String signUp(String inputMail, String inputPassword) {
        if(inputMail.isBlank() || inputPassword.isBlank()) return null;
        User user = userRepository.getUserByEmail(inputMail);

        if(user != null) throw new RuntimeException("既にアカウントは存在します");

        String hashedPassword = BCrypt.hashpw(inputPassword, BCrypt.gensalt());
        User newUser = new User(inputMail, hashedPassword);
        userRepository.createUser(newUser);

        User createdUser = userRepository.getUserByEmail(inputMail);
        String token = jwtService.generateToken(createdUser.getId());
        return token;
    }
}
