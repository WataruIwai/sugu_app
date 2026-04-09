package backend.dictionary.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import backend.dictionary.dto.DictionaryWord;
import backend.dictionary.dto.WordEntry;

@Repository
public class DictionaryRepository {
    private Connection connection;

    public DictionaryRepository(Connection connection) {
        this.connection = connection;
    }
    //word=単語を返す
    public Optional<DictionaryWord> queryWordData(String word) {
        String sql = "SELECT id, word, normalized_word FROM dictionary_words WHERE normalized_word = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, word);

            try (ResultSet resultSet = statement.executeQuery()) {
                if(resultSet.next()) {
                    DictionaryWord dictionaryWord = new DictionaryWord(
                        resultSet.getLong("id"),
                        resultSet.getString("word"),
                        resultSet.getString("normalized_word")
                    );
                    return Optional.of(dictionaryWord);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return Optional.empty();
    }

    //entries=意味を返す
    public List<WordEntry> queryWordEntriesData(long wordId) {
        String sql = "SELECT meaning, japanese, example FROM dictionary_entries WHERE dictionary_word_id = ? ORDER BY display_order";

        List<WordEntry> entries = new ArrayList<>();

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, wordId);

            try (ResultSet resultSet = statement.executeQuery()) {
                while(resultSet.next()) {
                    WordEntry dictionaryWord = new WordEntry(
                        resultSet.getString("meaning"),
                        resultSet.getString("japanese"),
                        resultSet.getString("example")
                    );
                    entries.add(dictionaryWord);
                }
                return entries;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public Long createWordData(String word) {
        String sql = "INSERT INTO dictionary_words (word, normalized_word) VALUES (?, ?) ON CONFLICT D NOTHING RETURNING id";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, word);
            statement.setString(2, word.toLowerCase());
            try (ResultSet rs = statement.executeQuery()) {
                if(rs.next()) {
                    return rs.getLong("id");
                }

                // conflictでINSERTされなかった場合（既存データ）
                return findWordIdByNormalizedWord(word.toLowerCase());
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public long findWordIdByNormalizedWord(String normalizedWord) {
        String sql = "SELECT id FROM dictionary_words WHERE normalized_word = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, normalizedWord);
            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong("id");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        throw new RuntimeException("Word not found");
    }

    public void createEntriesData(long wordId, List<WordEntry> entries) {
        String sql = "INSERT INTO dictionary_entries (dictionary_word_id, display_order, meaning, japanese, example) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            for(int i = 0; i < entries.size(); i++) {
                WordEntry entry = entries.get(i);

                statement.setLong(1, wordId);
                statement.setInt(2, i + 1);
                statement.setString(3, entry.getMeaning());
                statement.setString(4, entry.getJapanese());
                statement.setString(5, entry.getExample());

                statement.executeBatch();
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
