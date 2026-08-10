package backend.dictionary.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.anyList;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import backend.dictionary.dto.WordEntry;
import backend.dictionary.dto.WordResponse;
import backend.dictionary.repository.DictionaryRepository;
import backend.dictionary.util.SearchContext;
import backend.exception.TooManyRequestsException;
import backend.external.OpenAiClient;
import backend.external.dto.OpenAiResponse;
import backend.subscription.repository.SubscriptionRepository;
import backend.usage.domain.GuestUsageCount;
import backend.usage.domain.UserUsageCount;
import backend.usage.repository.UsageRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DictionaryServiceTest {
  @Mock DictionaryRepository dictionaryRepository;
  @Mock OpenAiClient openAiClient;
  @Mock UsageRepository usageRepository;
  @Mock DictionaryWriteService dictionaryWriteService;
  @Mock SubscriptionRepository subscriptionRepository;

  @InjectMocks DictionaryService dictionaryService;

  private GuestUsageCount guestUsage(String guestId) {
    return new GuestUsageCount(1L, guestId, LocalDate.now(), 3, 1);
  }

  private UserUsageCount userUsage(long userId) {
    return new UserUsageCount(1L, userId, LocalDate.now(), 10, 0, 1, 0);
  }

  private OpenAiResponse successOpenAiResponse(String word) {
    OpenAiResponse response = new OpenAiResponse();
    response.setInputWord(word);
    response.setResolvedWord(word);
    response.setCandidates(List.of());
    response.setEntries(List.of(new WordEntry("a fruit", "りんご", "I ate an apple.")));
    return response;
  }

  @Test
  void returnSpellingSuspectedAndRollbackWhenResolvedWordIsBlank() {
    // Arrange
    String guestId = "guest-test";
    SearchContext searchContext = SearchContext.forGuest(guestId);

    GuestUsageCount usage = guestUsage(guestId);

    OpenAiResponse openAiResponse = new OpenAiResponse();
    openAiResponse.setInputWord("www");
    openAiResponse.setResolvedWord("");
    openAiResponse.setCandidates(List.of("web", "ww", "www."));
    openAiResponse.setEntries(List.of());

    when(usageRepository.getGuestUsage(guestId)).thenReturn(Optional.of(usage));
    when(usageRepository.consumeGuestUsage(usage)).thenReturn(true);
    when(dictionaryRepository.queryWordData("www")).thenReturn(Optional.empty());
    when(openAiClient.fetchWordData("www")).thenReturn(openAiResponse);

    // Act
    WordResponse response = dictionaryService.getWordData("www", searchContext);

    // Assert
    assertEquals("SPELLING_SUSPECTED", response.getStatus());
    assertEquals("www", response.getWord());
    assertEquals(List.of("web", "ww", "www."), response.getCandidates());

    verify(usageRepository).rollbackGuestUsage(usage);
    verify(dictionaryWriteService, never()).createWordDataWithEntries(anyString(), anyList());
  }

  @Test
  void reachBaseLimitThrowException() {
    String guestId = "guest-test";
    SearchContext searchContext = SearchContext.forGuest(guestId);

    GuestUsageCount usage = new GuestUsageCount(1L, guestId, LocalDate.now(), 3, 3);

    when(usageRepository.getGuestUsage(guestId)).thenReturn(Optional.of(usage));
    when(usageRepository.consumeGuestUsage(usage)).thenReturn(false);

    // Act & Assert
    assertThrows(
        TooManyRequestsException.class,
        () -> dictionaryService.getWordData("apple", searchContext));

    verify(dictionaryRepository, never()).queryWordData(anyString());
    verify(openAiClient, never()).fetchWordData(anyString());
    verify(dictionaryWriteService, never()).createWordDataWithEntries(anyString(), anyList());
  }

  @Test
  void searchWhenBaseUsageAvailable() {
    // Arrange
    String guestId = "guest-test";
    SearchContext searchContext = SearchContext.forGuest(guestId);
    GuestUsageCount usage = guestUsage(guestId);
    OpenAiResponse openAiResponse = successOpenAiResponse("apple");

    when(usageRepository.getGuestUsage(guestId)).thenReturn(Optional.of(usage));
    when(usageRepository.consumeGuestUsage(usage)).thenReturn(true);
    when(dictionaryRepository.queryWordData("apple")).thenReturn(Optional.empty());
    when(openAiClient.fetchWordData("apple")).thenReturn(openAiResponse);

    // Act
    WordResponse response = dictionaryService.getWordData("apple", searchContext);

    // Assert
    assertEquals("SUCCESS", response.getStatus());
    assertEquals("apple", response.getWord());

    verify(usageRepository).consumeGuestUsage(usage);
    verify(openAiClient).fetchWordData("apple");
    verify(dictionaryWriteService).createWordDataWithEntries("apple", openAiResponse.getEntries());
  }

  @Test
  void proUserSearchDoesNotConsumeUsage() {
    // Arrange
    long userId = 1L;
    SearchContext searchContext = SearchContext.forUser(userId);
    UserUsageCount usage = userUsage(userId);
    OpenAiResponse openAiResponse = successOpenAiResponse("apple");

    when(usageRepository.getUserUsage(userId)).thenReturn(Optional.of(usage));
    when(subscriptionRepository.isActive(userId)).thenReturn(true);
    when(dictionaryRepository.queryWordData("apple")).thenReturn(Optional.empty());
    when(openAiClient.fetchWordData("apple")).thenReturn(openAiResponse);

    // Act
    WordResponse response = dictionaryService.getWordData("apple", searchContext);

    // Assert
    assertEquals("SUCCESS", response.getStatus());
    assertEquals("apple", response.getWord());

    verify(usageRepository, never()).consumeUserUsage(usage);
    verify(usageRepository, never()).consumeUserBonusUsage(usage);
    verify(usageRepository, never()).rollbackUserUsage(usage);
    verify(usageRepository, never()).rollbackUserBonusUsage(usage);
    verify(openAiClient).fetchWordData("apple");
    verify(dictionaryWriteService).createWordDataWithEntries("apple", openAiResponse.getEntries());
  }
}
