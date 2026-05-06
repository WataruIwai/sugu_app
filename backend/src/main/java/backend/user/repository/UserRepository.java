package backend.user.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import backend.exception.DatabaseException;
import backend.user.domain.User;

@Repository
public class UserRepository {
    private static final Logger logger = LoggerFactory.getLogger(UserRepository.class);
    private final DataSource dataSource;

    public UserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public User getUser(long userId) {
        String sql = "SELECT id, email, auth_provider, provider_user_id FROM users WHERE id = ?";

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
                        null,
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
        String sql = "SELECT id, email, auth_provider, provider_user_id FROM users WHERE provider_user_id = ?";

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
                        null,
                        resultSet.getString("auth_provider"),
                        resultSet.getString("provider_user_id")
                    );
                }
                return null;
            }
        } catch (SQLException e) {
            logger.error(
                "UserRepository.getUserByProviderUserId failed. providerUserId={}, sqlState={}, message={}",
                providerUserId,
                e.getSQLState(),
                e.getMessage(),
                e
            );
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
