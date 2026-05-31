package backend.dictionary.repository;

import backend.dictionary.dto.DictionaryWord;
import backend.dictionary.dto.WordEntry;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class DictionaryRepository {

  private final JdbcClient jdbcClient;
  private final JdbcTemplate jdbcTemplate;

  public DictionaryRepository(JdbcClient jdbcClient, JdbcTemplate jdbcTemplate) {
    this.jdbcClient = jdbcClient;
    this.jdbcTemplate = jdbcTemplate;
  }

  // word=単語を返す
  public Optional<DictionaryWord> queryWordData(String word) {
    String sql =
        """
            SELECT id, word, normalized_word FROM dictionary_words
            WHERE normalized_word = :normalizedWord;
        """;

    return jdbcClient
        .sql(sql)
        .param("normalizedWord", word)
        .query(
            (ResultSet rs, int rowNum) ->
                new DictionaryWord(
                    rs.getLong("id"), rs.getString("word"), rs.getString("normalized_word")))
        .optional();
  }

  // entries=意味を返す
  public List<WordEntry> queryWordEntriesData(long wordId) {
    String sql =
        """
            SELECT meaning_en, meaning_ja, example FROM dictionary_entries
            WHERE dictionary_word_id = :dictionaryWordId
            ORDER BY display_order;
        """;

    return jdbcClient
        .sql(sql)
        .param("dictionaryWordId", wordId)
        .query(
            (ResultSet rs, int rowNum) ->
                new WordEntry(
                    rs.getString("meaning_en"),
                    rs.getString("meaning_ja"),
                    rs.getString("example")))
        .list();
  }

  public Long createWordData(String word) {
    String normalizedWord = word.toLowerCase();
    String sql =
        """
            INSERT INTO dictionary_words (word, normalized_word)
            VALUES (:word, :normalizedWord)
            ON CONFLICT DO NOTHING RETURNING id
        """;

    return jdbcClient
        .sql(sql)
        .param("word", word)
        .param("normalizedWord", normalizedWord)
        .query(Long.class)
        .optional()
        .orElseGet(() -> findWordIdByNormalizedWord(normalizedWord));
  }

  public long findWordIdByNormalizedWord(String normalizedWord) {
    String sql =
        """
            SELECT id FROM dictionary_words WHERE normalized_word = :normalizedWord
        """;

    return jdbcClient.sql(sql).param("normalizedWord", normalizedWord).query(Long.class).single();
  }

  public void createEntriesData(long wordId, List<WordEntry> entries) {
    String sql =
        """
            INSERT INTO dictionary_entries (dictionary_word_id, display_order, meaning_en, meaning_ja, example)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT DO NOTHING
        """;

    jdbcTemplate.batchUpdate(
        sql,
        new BatchPreparedStatementSetter() {
          @Override
          public void setValues(PreparedStatement ps, int i) throws SQLException {
            WordEntry entry = entries.get(i);

            ps.setLong(1, wordId);
            ps.setInt(2, i + 1);
            ps.setString(3, entry.getMeaning());
            ps.setString(4, entry.getJapanese());
            ps.setString(5, entry.getExample());
          }

          @Override
          public int getBatchSize() {
            return entries.size();
          }
        });
  }
}
