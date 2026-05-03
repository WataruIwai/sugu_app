package backend.user.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

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
        String sql = "SELECT id, email, password_hash, auth_provider, provider_user_id, created_at, updated_at FROM users WHERE id = ?";

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
                        resultSet.getString("password_hash"),
                        resultSet.getString("auth_provider"),
                        resultSet.getString("provider_user_id")
                    );
                }
                return null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get user", e);
        }
    }

    public User getUserByEmail(String email) {
        String sql = "SELECT id, email, password_hash, auth_provider, provider_user_id, created_at, updated_at FROM users WHERE email = ?";

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
                        resultSet.getString("password_hash"),
                        resultSet.getString("auth_provider"),
                        resultSet.getString("provider_user_id")
                    );
                }
                return null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get user by email", e);
        }
    }

    public int createUser(User newUser) {
        String sql = "INSERT INTO users (email, password_hash, auth_provider, provider_user_id, terms_version, agreed_terms_at) VALUES (?, ?, ?, ?, ?, ?)";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, newUser.getEmail());
            statement.setString(2, newUser.getPasswordHash());
            statement.setString(3, newUser.getAuthProvider());
            statement.setString(4, newUser.getProviderUserId());
            statement.setString(5, newUser.getTermsVersion());
            statement.setTimestamp(6, Timestamp.valueOf(newUser.getAgreedTermsAt()));
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

    public User getUserByProviderUserId(String providerUserId) {
        String sql = "SELECT id, email, password_hash, auth_provider, provider_user_id, created_at, updated_at FROM users WHERE provider_user_id = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, providerUserId);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return new User(
                        resultSet.getLong("id"),
                        resultSet.getString("email"),
                        resultSet.getString("password_hash"),
                        resultSet.getString("auth_provider"),
                        resultSet.getString("provider_user_id")
                    );
                }
                return null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get user by provider user id", e);
        }
    }

    public long createUserWithAppleId(User newUser) {
        String sql = """
        INSERT INTO users (email, auth_provider, provider_user_id, terms_version, agreed_terms_at)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
        """;

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, newUser.getEmail());
            statement.setString(2, newUser.getAuthProvider());
            statement.setString(3, newUser.getProviderUserId());
            statement.setString(4, newUser.getTermsVersion());
            statement.setTimestamp(5, Timestamp.valueOf(newUser.getAgreedTermsAt()));
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return resultSet.getLong("id");
                }
                throw new DatabaseException("Failed to create user with Apple ID");
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create user", e);
        }
    }
}
