package backend.user.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.springframework.stereotype.Repository;

import backend.user.domain.User;

@Repository
public class UserRepository {
    private Connection connection;

    public UserRepository(Connection connection) {
        this.connection = connection;
    }

    public User getUser(long userId) {
        String sql = "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE id = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, userId);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return new User(
                        resultSet.getLong("id"),
                        resultSet.getString("email"),
                        resultSet.getString("password_hash")
                    );
                }
                return null;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public User getUserByEmail(String email) {
        String sql = "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, email);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return new User(
                        resultSet.getLong("id"),
                        resultSet.getString("email"),
                        resultSet.getString("password_hash")
                    );
                }
                return null;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public int createUser(User newUser) {
        String sql = "INSERT INTO users (email, password_hash) VALUES (?, ?)";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, newUser.getEmail());
            statement.setString(2, newUser.getPasswordHash());
            int affectedRows = statement.executeUpdate();
            return affectedRows;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
