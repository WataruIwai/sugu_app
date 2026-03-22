package backend;

import java.sql.Connection;
import java.util.List;

import backend.auth.controller.AuthController;
import backend.auth.service.AuthService;
import backend.db.ConnectionFactory;
import backend.user.repository.UserRepository;
import backend.user.service.UserService;
import backend.word.controller.WordController;
import backend.word.domain.Word;
import backend.word.repository.WordRepository;
import backend.word.service.WordService;

public class Main {
    public static void main(String[] args) {
        Connection connection = ConnectionFactory.createConnection();
        // WordRepository wordRepository = new WordRepository(connection);
        // WordService wordService = new WordService(wordRepository);
        // WordController wordController = new WordController(wordService);
        // wordController.deleteWord(1, 4);
        // wordController.deleteWord(1, 5);
        UserRepository userRepository = new UserRepository(connection);
        AuthService authService = new AuthService(userRepository);
        AuthController authController = new AuthController(authService);
        authController.signIn("xxxxxx3@gmail.com", "passwor");
    }
}
