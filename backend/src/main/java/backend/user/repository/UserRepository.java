package backend.user.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import backend.exception.DatabaseException;
import backend.user.domain.User;

@Repository
public class UserRepository {
    private final DataSource dataSource;

    public UserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public User getUser(long userId) {
        String sql = "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE id = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
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
            throw new DatabaseException("Failed to get user", e);
        }
    }

    public User getUserByEmail(String email) {
        String sql = "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
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
            throw new DatabaseException("Failed to get user by email", e);
        }
    }

    public int createUser(User newUser) {
        String sql = "INSERT INTO users (email, password_hash, terms_version, agreed_terms_at) VALUES (?, ?, ?, ?)";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, newUser.getEmail());
            statement.setString(2, newUser.getPasswordHash());
            statement.setString(3, newUser.getTermsVersion());
            statement.setTimestamp(4, Timestamp.valueOf(newUser.getAgreedTermsAt()));
            int affectedRows = statement.executeUpdate();
            return affectedRows;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create user", e);
        }
    }

    public int updateUserMail(long userId, String email) {
        String sql = "UPDATE users SET email = ? WHERE id = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, email);
            statement.setLong(2,userId);

            int affectedRows = statement.executeUpdate();
            return affectedRows;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update user's email", e);
        }
    }

    public int updateUserPassword(long userId, String password) {
        String sql = "UPDATE users SET password_hash = ? WHERE id = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, password);
            statement.setLong(2,userId);

            int affectedRows = statement.executeUpdate();
            return affectedRows;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update user's password", e);
        }
    }

    public void deleteUser(long userId) {
        String sql = "DELETE FROM users WHERE id = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, userId);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete user", e);
        }
    }
}
