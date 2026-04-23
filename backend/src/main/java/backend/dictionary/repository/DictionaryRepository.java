package backend.dictionary.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import backend.dictionary.dto.DictionaryWord;
import backend.dictionary.dto.WordEntry;
import backend.exception.DatabaseException;
import backend.exception.NotFoundException;

@Repository
public class DictionaryRepository {
    private final DataSource dataSource;

    public DictionaryRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }
    //word=単語を返す
    public Optional<DictionaryWord> queryWordData(String word) {
        String sql = "SELECT id, word, normalized_word FROM dictionary_words WHERE normalized_word = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
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
            throw new DatabaseException("Failed to query dictionary word data", e);
        }
        return Optional.empty();
    }

    //entries=意味を返す
    public List<WordEntry> queryWordEntriesData(long wordId) {
        String sql = "SELECT meaning_en, meaning_ja, example FROM dictionary_entries WHERE dictionary_word_id = ? ORDER BY display_order";

        List<WordEntry> entries = new ArrayList<>();

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setLong(1, wordId);

            try (ResultSet resultSet = statement.executeQuery()) {
                while(resultSet.next()) {
                    WordEntry dictionaryWord = new WordEntry(
                        resultSet.getString("meaning_en"),
                        resultSet.getString("meaning_ja"),
                        resultSet.getString("example")
                    );
                    entries.add(dictionaryWord);
                }
                return entries;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to query dictionary word entries", e);
        }
    }

    public Long createWordData(String word) {
        String sql = "INSERT INTO dictionary_words (word, normalized_word) VALUES (?, ?) ON CONFLICT DO NOTHING RETURNING id";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, word);
            statement.setString(2, word);
            try (ResultSet rs = statement.executeQuery()) {
                if(rs.next()) {
                    return rs.getLong("id");
                }

                // conflictでINSERTされなかった場合（既存データ）
                return findWordIdByNormalizedWord(word.toLowerCase());
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create dictionary word data", e);
        }
    }

    public long findWordIdByNormalizedWord(String normalizedWord) {
        String sql = "SELECT id FROM dictionary_words WHERE normalized_word = ?";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, normalizedWord);
            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong("id");
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find dictionary word id by normalized word", e);
        }
        throw new NotFoundException("Word not found");
    }

    public void createEntriesData(long wordId, List<WordEntry> entries) {
        String sql = "INSERT INTO dictionary_entries (dictionary_word_id, display_order, meaning_en, meaning_ja, example) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING";

        try (
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            for(int i = 0; i < entries.size(); i++) {
                WordEntry entry = entries.get(i);

                statement.setLong(1, wordId);
                statement.setInt(2, i + 1);
                statement.setString(3, entry.getMeaning());
                statement.setString(4, entry.getJapanese());
                statement.setString(5, entry.getExample());

                statement.addBatch();
            }
            statement.executeBatch();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create dictionary entries", e);
        }
    }
}
