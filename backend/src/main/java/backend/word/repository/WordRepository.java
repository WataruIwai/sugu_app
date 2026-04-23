package backend.word.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import backend.exception.DatabaseException;
import backend.exception.NotFoundException;
import backend.word.domain.Word;

@Repository
public class WordRepository {
    private final DataSource dataSource;

    public WordRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    //ユーザーが登録している全ての単語
    public List<Word> getWords(long userId) {
        List<Word> list = new ArrayList<>();
        String sql = "SELECT id, user_id, word, dictionary_word_id FROM user_words WHERE user_id = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, userId);

            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    Word word = new Word(
                        resultSet.getLong("id"),
                        resultSet.getLong("user_id"),
                        resultSet.getString("word"),
                        resultSet.getLong("dictionary_word_id")
                    );
                    list.add(word);
                }
                return list;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get words", e);
        }
    }

    //詳細
    public Optional<Word> getWord(long wordId, long userId) {
        String sql = "SELECT id, user_id, word, dictionary_word_id FROM user_words WHERE id = ? AND user_id = ?;";
        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, wordId);
            statement.setLong(2, userId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {

                    Word userWord = new Word(
                        resultSet.getLong("id"),
                        resultSet.getLong("user_id"),
                        resultSet.getString("word"),
                        resultSet.getInt("dictionary_word_id")
                    );

                    return Optional.of(userWord);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get word", e);
        }
        return Optional.empty();
    }

    public void createWord(Word newWord) {
        String sql = "INSERT INTO user_words (user_id, word, dictionary_word_id) VALUES(?, ?, ?)";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, newWord.getUserId());
            statement.setString(2, newWord.getWord());
            statement.setLong(3, newWord.getDictionaryWordId());

            int affectedRows = statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create word", e);
        }
    }

    public void deleteWord(long wordId, long userId) {
        String sql = "DELETE FROM  user_words WHERE id = ? AND user_id = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, wordId);
            statement.setLong(2, userId);

            int affectedRows = statement.executeUpdate();
            if(affectedRows == 0) {
                throw new NotFoundException("Delete target was not found.");
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete word", e);
        }
    }
}
