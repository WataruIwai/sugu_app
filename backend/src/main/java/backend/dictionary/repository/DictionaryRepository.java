package backend.dictionary.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import backend.dictionary.domain.DictionaryEntry;

@Repository
public class DictionaryRepository {
    private Connection connection;

    public DictionaryRepository(Connection connection) {
        this.connection = connection;
    }
    //dictionary_entriesに単語データがあるのか問い合わせる
    public Optional<DictionaryEntry> queryWordData(String word) {
        String sql = "SELECT id, word, meaning, japanese, example FROM dictionary_entries WHERE word = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, word);

            try (ResultSet resultSet = statement.executeQuery()) {
                if(resultSet.next()) {
                    DictionaryEntry dictionaryEntry = new DictionaryEntry(
                        resultSet.getLong("id"),
                        resultSet.getString("word"),
                        resultSet.getString("meaning"),
                        resultSet.getString("japanese"),
                        resultSet.getString("example")
                    );
                    return Optional.of(dictionaryEntry);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return Optional.empty();
    }

    public void createWordData(String word, String meaning, String japanese, String example) {
        String sql = "INSERT INTO dictionary_entries (word, meaning, japanese, example) VALUES (?, ?, ?, ?) ON CONFLICT D NOTHING";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, word);
            statement.setString(2, meaning);
            statement.setString(3, japanese);
            statement.setString(4, example);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
