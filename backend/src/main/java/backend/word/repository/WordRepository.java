package backend.word.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Repository;

import backend.word.domain.Word;

@Repository
public class WordRepository {
    private Connection connection;

    public WordRepository(Connection connection) {
        this.connection = connection;
    }
    public List<Word> getWords(long userId) {
        List<Word> list = new ArrayList<>();
        String sql = "SELECT id, user_id, word, meaning, memo, pronunciation FROM words WHERE user_id = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, userId);

            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    Word word = new Word(
                        resultSet.getLong("id"),
                        resultSet.getLong("user_id"),
                        resultSet.getString("word"),
                        resultSet.getString("meaning"),
                        resultSet.getString("memo"),
                        resultSet.getString("pronunciation")
                    );
                    list.add(word);
                }
                return list;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public Word getWord(long userId, long wordId) {
        String sql = "SELECT id, user_id, word, meaning, memo, pronunciation FROM words WHERE user_id = ? AND id = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, userId);
            statement.setLong(2, wordId);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return new Word(
                        resultSet.getLong("id"),
                        resultSet.getLong("user_id"),
                        resultSet.getString("word"),
                        resultSet.getString("meaning"),
                        resultSet.getString("memo"),
                        resultSet.getString("pronunciation")
                    );
                }
                return null;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public void createWord(Word newWord) {
        String sql = "INSERT INTO words (user_id, word, meaning, memo, pronunciation) VALUES(?, ?, ?, ?, ?)";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, newWord.getUserId());
            statement.setString(2, newWord.getWord());
            statement.setString(3, newWord.getMeaning());
            statement.setString(4, newWord.getMemo());
            statement.setString(5, newWord.getPronunciation());

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public void updateWord(Word updatedWord) {
        String sql = "UPDATE words SET word = ?, meaning = ?, memo = ?, pronunciation = ? WHERE id = ? AND user_id = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, updatedWord.getWord());
            statement.setString(2, updatedWord.getMeaning());
            statement.setString(3, updatedWord.getMemo());
            statement.setString(4, updatedWord.getPronunciation());
            statement.setLong(5, updatedWord.getId());
            statement.setLong(6, updatedWord.getUserId());

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public void deleteWord(long userId, long wordId) {
        String sql = "DELETE FROM words WHERE id = ? AND user_id = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, wordId);
            statement.setLong(2, userId);

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
