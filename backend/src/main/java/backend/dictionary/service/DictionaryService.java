package backend.dictionary.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import backend.dictionary.dto.DictionaryWord;
import backend.dictionary.dto.WordEntry;
import backend.dictionary.dto.WordResponse;
import backend.dictionary.repository.DictionaryRepository;
import backend.dictionary.util.SearchContext;
import backend.exception.BadRequestException;
import backend.exception.TooManyRequestsException;
import backend.external.OpenAiClient;
import backend.external.dto.OpenAiResponse;
import backend.usage.domain.GuestUsageCount;
import backend.usage.domain.UserUsageCount;
import backend.usage.interfaces.UsageCount;
import backend.usage.repository.UsageRepository;

@Service
public  class DictionaryService {
    private DictionaryRepository dictionaryRepository;
    private OpenAiClient openAiClient;
    private UsageRepository usageRepository;

    private enum ConsumedUsageType {
        BASE,
        BONUS
    }

    public DictionaryService(DictionaryRepository dictionaryRepository, OpenAiClient openAiClient, UsageRepository usageRepository) {
        this.dictionaryRepository = dictionaryRepository;
        this.openAiClient = openAiClient;
        this.usageRepository = usageRepository;
    }

    @Transactional
    public WordResponse getWordData(String searchWord, SearchContext searchContext) {
        UsageCount usage;

        if (searchWord.matches("^.*[\\p{IsHan}\\p{IsHiragana}\\p{IsKatakana}].*")) {
            throw new BadRequestException("Please enter the word in romaji or English");
        }

        if(searchContext.getGuestId() != null) {
            String guestId = searchContext.getGuestId();
            usage = usageRepository.getGuestUsage(guestId).orElseGet(() -> usageRepository.createGuestUsage(guestId));
        } else {
            long userId = searchContext.getUserId();
            //検索回数データ取得し、無かったら作成する
            usage = usageRepository.getUserUsage(userId).orElseGet(() -> usageRepository.createUserUsage(userId));
        }

        ConsumedUsageType consumedUsageType = consumeUsage(searchContext, usage);
        boolean shouldRollbackUsage = true;

        try {
            Optional<DictionaryWord> queryWordDataResult = dictionaryRepository.queryWordData(searchWord);
            //検索ロジック
            if(queryWordDataResult.isPresent()) {
                long id = queryWordDataResult.get().getId();
                String word = queryWordDataResult.get().getNormalizedWord();
                List<WordEntry> entries = dictionaryRepository.queryWordEntriesData(id);
                shouldRollbackUsage = false;
                return new WordResponse(word, entries, "SUCCESS");
            } else {
                OpenAiResponse openAiResult = openAiClient.fetchWordData(searchWord);
                String inputWord = openAiResult.getInputWord();
                String resolvedWord = openAiResult.getResolvedWord();
                List<String> candidates = openAiResult.getCandidates();
                List<WordEntry> entries = openAiResult.getEntries();
                if(resolvedWord ==  null || !inputWord.equalsIgnoreCase(resolvedWord)) {
                    //スペルミスなどでcandidatesに値が3つあるパターン
                    rollbackUsage(searchContext, usage, consumedUsageType);
                    shouldRollbackUsage = false;
                    return new WordResponse(inputWord, candidates, entries,"SPELLING_SUSPECTED");
                } else {
                    String normalized = resolvedWord.trim().toLowerCase();
                    long id = dictionaryRepository.createWordData(normalized);
                    dictionaryRepository.createEntriesData(id, entries);
                    shouldRollbackUsage = false;
                    return new WordResponse(normalized, candidates, entries, "SUCCESS");
                }
            }
        } catch (RuntimeException e) {
            if(shouldRollbackUsage) {
                rollbackUsage(searchContext, usage, consumedUsageType);
            }
            throw e;
        }
    }

    private ConsumedUsageType consumeUsage(SearchContext searchContext, UsageCount usage) {
        if(searchContext.getGuestId() != null) {
            GuestUsageCount guestUsage = (GuestUsageCount) usage;
            if(usageRepository.consumeGuestUsage(guestUsage)) {
                return ConsumedUsageType.BASE;
            }

            if(usageRepository.consumeGuestBonusUsage(guestUsage)) {
                return ConsumedUsageType.BONUS;
            }
        } else {
            UserUsageCount userUsage = (UserUsageCount) usage;
            if(usageRepository.consumeUserUsage(userUsage)) {
                return ConsumedUsageType.BASE;
            }

            if(usageRepository.consumeUserBonusUsage(userUsage)) {
                return ConsumedUsageType.BONUS;
            }
        }

        throw new TooManyRequestsException("検索上限です。");
    }

    private void rollbackUsage(SearchContext searchContext, UsageCount usage, ConsumedUsageType consumedUsageType) {
        if(searchContext.getGuestId() != null) {
            GuestUsageCount guestUsage = (GuestUsageCount) usage;
            if(consumedUsageType == ConsumedUsageType.BASE) {
                usageRepository.rollbackGuestUsage(guestUsage);
            } else {
                usageRepository.rollbackGuestBonusUsage(guestUsage);
            }
        } else {
            UserUsageCount userUsage = (UserUsageCount) usage;
            if(consumedUsageType == ConsumedUsageType.BASE) {
                usageRepository.rollbackUserUsage(userUsage);
            } else {
                usageRepository.rollbackUserBonusUsage(userUsage);
            }
        }
    }
}
