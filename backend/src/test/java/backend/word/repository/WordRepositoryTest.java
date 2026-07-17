package backend.word.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import backend.word.domain.Word;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.jdbc.core.simple.JdbcClient;

@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class WordRepositoryTest {
  private static final String TEST_PREFIX = "jdbc-word-repository-test";

  @Autowired private JdbcClient jdbcClient;

  private WordRepository wordRepository;

  @BeforeEach
  void setUp() {
    wordRepository = new WordRepository(jdbcClient);
    cleanUp();
  }

  @AfterEach
  void tearDown() {
    cleanUp();
  }

  @Test
  void returnEmptyWhenOtherUserAccessesWord() {
    long ownerUserId = insertUser(TEST_PREFIX + "-owner@example.com", TEST_PREFIX + "-owner");
    long otherUserId = insertUser(TEST_PREFIX + "-other@example.com", TEST_PREFIX + "-other");
    long dictionaryWordId = insertDictionaryWord(TEST_PREFIX + "-apple");
    long userWordId = insertUserWord(ownerUserId, TEST_PREFIX + "-apple", dictionaryWordId);

    Optional<Word> result = wordRepository.getWord(userWordId, otherUserId);

    assertTrue(result.isEmpty());
  }

  @Test
  void returnWordWhenOwnerAccessesWord() {
    long ownerUserId = insertUser(TEST_PREFIX + "-owner@example.com", TEST_PREFIX + "-owner");
    long dictionaryWordId = insertDictionaryWord(TEST_PREFIX + "-apple");
    long userWordId = insertUserWord(ownerUserId, TEST_PREFIX + "-apple", dictionaryWordId);

    Optional<Word> result = wordRepository.getWord(userWordId, ownerUserId);

    assertTrue(result.isPresent());
    assertEquals(ownerUserId, result.get().getUserId());
    assertEquals(TEST_PREFIX + "-apple", result.get().getWord());
    assertEquals(dictionaryWordId, result.get().getDictionaryWordId());
  }

  private long insertUser(String email, String providerUserId) {
    return jdbcClient
        .sql(
            """
            INSERT INTO users (email, auth_provider, provider_user_id)
            VALUES (:email, :authProvider, :providerUserId)
            RETURNING id
            """)
        .param("email", email)
        .param("authProvider", "apple")
        .param("providerUserId", providerUserId)
        .query(Long.class)
        .single();
  }

  private long insertDictionaryWord(String word) {
    return jdbcClient
        .sql(
            """
            INSERT INTO dictionary_words (word, normalized_word)
            VALUES (:word, :normalizedWord)
            RETURNING id
            """)
        .param("word", word)
        .param("normalizedWord", word)
        .query(Long.class)
        .single();
  }

  private long insertUserWord(long userId, String word, long dictionaryWordId) {
    return jdbcClient
        .sql(
            """
            INSERT INTO user_words (user_id, word, dictionary_word_id)
            VALUES (:userId, :word, :dictionaryWordId)
            RETURNING id
            """)
        .param("userId", userId)
        .param("word", word)
        .param("dictionaryWordId", dictionaryWordId)
        .query(Long.class)
        .single();
  }

  private void cleanUp() {
    jdbcClient
        .sql(
            """
            DELETE FROM user_words
            WHERE word LIKE :wordPrefix
            """)
        .param("wordPrefix", TEST_PREFIX + "%")
        .update();

    jdbcClient
        .sql(
            """
            DELETE FROM dictionary_words
            WHERE normalized_word LIKE :wordPrefix
            """)
        .param("wordPrefix", TEST_PREFIX + "%")
        .update();

    jdbcClient
        .sql(
            """
            DELETE FROM users
            WHERE email LIKE :emailPrefix
            """)
        .param("emailPrefix", TEST_PREFIX + "%")
        .update();
  }
}
