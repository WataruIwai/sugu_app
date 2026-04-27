package backend.usage.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Optional;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import backend.exception.DatabaseException;
import backend.usage.domain.GuestUsageCount;
import backend.usage.domain.UserUsageCount;
import backend.usage.interfaces.UsageCount;

@Repository
public class UsageRepository {
    private final DataSource dataSource;

    public UsageRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public  Optional<UserUsageCount> getUserUsage(long userId) {
        String sql = "SELECT id, user_id, usage_date, base_limit, bonus_count, used_count, bonus_used_count FROM user_search_usage WHERE user_id = ? AND usage_date = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, userId);
            LocalDate today = LocalDate.now();
            statement.setDate(2, java.sql.Date.valueOf(today));

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    UserUsageCount userUsageCount = new UserUsageCount(
                        resultSet.getLong("id"),
                        resultSet.getLong("user_id"),
                        resultSet.getDate("usage_date").toLocalDate(),
                        resultSet.getInt("base_limit"),
                        resultSet.getInt("bonus_count"),
                        resultSet.getInt("used_count"),
                        resultSet.getInt("bonus_used_count")
                    );
                    return Optional.of(userUsageCount);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get user's usage", e);
        }

        return Optional.empty();
    }

    public UserUsageCount createUserUsage(long userId) {
        String sql = """
                INSERT INTO user_search_usage (user_id, usage_date)
                VALUES (?, ?)
                ON CONFLICT (user_id, usage_date) DO NOTHING
                RETURNING id, user_id, usage_date, base_limit, bonus_count, used_count, bonus_used_count
                """;;

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, userId);
            LocalDate today = LocalDate.now();
            statement.setDate(2, java.sql.Date.valueOf(today));
            try (ResultSet resultSet = statement.executeQuery()) {
                if(resultSet.next()) {
                    UserUsageCount userUsageCount = new UserUsageCount(
                        resultSet.getLong("id"),
                        resultSet.getLong("user_id"),
                        resultSet.getDate("usage_date").toLocalDate(),
                        resultSet.getInt("base_limit"),
                        resultSet.getInt("bonus_count"),
                        resultSet.getInt("used_count"),
                        resultSet.getInt("bonus_used_count")
                    );
                    return userUsageCount;
                }
                //conflict対策、同時アクセスでも壊れないようにする
                return getUserUsage(userId).orElseThrow(() -> new RuntimeException("Failed to load user usage after conflict"));

            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create user's usage", e);
        }
    }

    public void updateUserUsage(UserUsageCount usage) {
        String sql = "UPDATE user_search_usage SET used_count = ? WHERE user_id = ? AND usage_date = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setInt(1, usage.getUsedCount());
            statement.setLong(2, usage.getUserId());
            statement.setDate(3, java.sql.Date.valueOf(usage.getUsageDate()));

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update user's usage", e);
        }
    }

    public void addBonusCountToUserUsage(UserUsageCount usage) {
        String sql = "UPDATE user_search_usage SET bonus_count = bonus_count + 3 WHERE user_id  = ? AND usage_date = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, usage.getUserId());
            statement.setDate(2, java.sql.Date.valueOf(usage.getUsageDate()));

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to add bonus count", e);
        }
    }

    public void updateBonusUserUsage(UserUsageCount usage) {
        String sql = "UPDATE user_search_usage SET bonus_used_count = ? WHERE user_id  = ? AND usage_date = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setInt(1, usage.getBonusUsedCount());
            statement.setLong(2, usage.getUserId());
            statement.setDate(3, java.sql.Date.valueOf(usage.getUsageDate()));

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to add bonus count", e);
        }
    }

    public  Optional<GuestUsageCount> getGuestUsage(String guestId) {
        String sql = "SELECT id, guest_id, usage_date, base_limit, bonus_count, used_count, bonus_used_count FROM guest_search_usage WHERE guest_id = ? AND usage_date = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, guestId);
            LocalDate today = LocalDate.now();
            statement.setDate(2, java.sql.Date.valueOf(today));

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    GuestUsageCount guestUsageCount = new GuestUsageCount(
                        resultSet.getLong("id"),
                        resultSet.getString("guest_id"),
                        resultSet.getDate("usage_date").toLocalDate(),
                        resultSet.getInt("base_limit"),
                        resultSet.getInt("bonus_count"),
                        resultSet.getInt("used_count"),
                        resultSet.getInt("bonus_used_count")
                    );
                    return Optional.of(guestUsageCount);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get guest's usage", e);
        }

        return Optional.empty();
    }

    public GuestUsageCount createGuestUsage(String guestId) {
        String sql = """
                INSERT INTO guest_search_usage (guest_id, usage_date)
                VALUES (?, ?)
                ON CONFLICT (guest_id, usage_date) DO NOTHING
                RETURNING id, guest_id, usage_date, base_limit, bonus_count, used_count, bonus_used_count
                """;;

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, guestId);
            LocalDate today = LocalDate.now();
            statement.setDate(2, java.sql.Date.valueOf(today));
            try (ResultSet resultSet = statement.executeQuery()) {
                if(resultSet.next()) {
                    GuestUsageCount guestUsageCount = new GuestUsageCount(
                        resultSet.getLong("id"),
                        resultSet.getString("guest_id"),
                        resultSet.getDate("usage_date").toLocalDate(),
                        resultSet.getInt("base_limit"),
                        resultSet.getInt("bonus_count"),
                        resultSet.getInt("used_count"),
                        resultSet.getInt("bonus_used_count")
                    );
                    return guestUsageCount;
                }
                //conflict対策、同時アクセスでも壊れないようにする
                return getGuestUsage(guestId).orElseThrow(() -> new RuntimeException("Failed to load user usage after conflict"));

            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to guest's usage", e);
        }
    }

    public void updateGuestUsage(GuestUsageCount usage) {
        String sql = "UPDATE guest_search_usage SET used_count = ? WHERE guest_id = ? AND usage_date = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setInt(1, usage.getUsedCount());
            statement.setString(2, usage.getGuestId());
            statement.setDate(3, java.sql.Date.valueOf(usage.getUsageDate()));

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update guest's usage", e);
        }
    }

    public void addBonusCountToGuestUsage(GuestUsageCount usage) {
        String sql = "UPDATE guest_search_usage SET bonus_count = bonus_count + 3 WHERE guest_id = ? AND usage_date = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, usage.getGuestId());
            statement.setDate(2, java.sql.Date.valueOf(usage.getUsageDate()));

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to add guest bonus count", e);
        }
    }

    public void updateBonusGuestUsage(GuestUsageCount usage) {
        String sql = "UPDATE guest_search_usage SET bonus_used_count = ? WHERE guest_id = ? AND usage_date = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setInt(1, usage.getBonusUsedCount());
            statement.setString(2, usage.getGuestId());
            statement.setDate(3, java.sql.Date.valueOf(usage.getUsageDate()));

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update guest bonus count", e);
        }
    }

}
