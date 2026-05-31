package backend.word.repository;

import backend.exception.NotFoundException;
import backend.word.domain.Word;
import java.sql.ResultSet;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class WordRepository {
  private final JdbcClient jdbcClient;

  public WordRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  // ユーザーが登録している全ての単語
  public List<Word> getWords(long userId) {
    String sql =
        """
            SELECT id, user_id, word, dictionary_word_id
            FROM user_words
            WHERE user_id = :userId
        """;

    return jdbcClient
        .sql(sql)
        .param("userId", userId)
        .query(
            (ResultSet rs, int rowNum) ->
                new Word(
                    rs.getLong("id"),
                    rs.getLong("user_id"),
                    rs.getString("word"),
                    rs.getLong("dictionary_word_id")))
        .list();
  }

  // 詳細
  public Optional<Word> getWord(long wordId, long userId) {
    String sql =
        """
            SELECT id, user_id, word, dictionary_word_id
            FROM user_words
            WHERE id = :wordId AND user_id = :userId
        """;

    return jdbcClient
        .sql(sql)
        .param("wordId", wordId)
        .param("userId", userId)
        .query(
            (ResultSet rs, int rowNum) ->
                new Word(
                    rs.getLong("id"),
                    rs.getLong("user_id"),
                    rs.getString("word"),
                    rs.getLong("dictionary_word_id")))
        .optional();
  }

  public void createWord(Word newWord) {
    String sql =
        """
            INSERT INTO user_words (user_id, word, dictionary_word_id)
            VALUES (:userId, :word, :dictionaryWordId)
        """;

    jdbcClient
        .sql(sql)
        .param("userId", newWord.getUserId())
        .param("word", newWord.getWord())
        .param("dictionaryWordId", newWord.getDictionaryWordId())
        .update();
  }

  public void deleteWord(long wordId, long userId) {
    String sql =
        """
            DELETE FROM user_words
            WHERE id = :wordId AND user_id = :userId
        """;

    int affectedRows = jdbcClient.sql(sql).param("wordId", wordId).param("userId", userId).update();

    if (affectedRows == 0) {
      throw new NotFoundException("Delete target was not found.");
    }
  }
}
