package backend;

import java.sql.Connection;

import backend.auth.controller.AuthController;
import backend.auth.jwt.JwtService;
import backend.auth.service.AuthService;
import backend.db.ConnectionFactory;
import backend.user.repository.UserRepository;


public class Main {
    public static void main(String[] args) {
        Connection connection = ConnectionFactory.createConnection();
        UserRepository userRepository = new UserRepository(connection);
        JwtService jwtService = new JwtService();
        AuthService authService = new AuthService(userRepository, jwtService);
        AuthController authController = new AuthController(authService);
        authController.signIn("xxxxxx4@gmail.com", "password");
    }
}
