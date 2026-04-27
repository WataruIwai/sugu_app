package backend.dictionary.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

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

    public DictionaryService(DictionaryRepository dictionaryRepository, OpenAiClient openAiClient, UsageRepository usageRepository) {
        this.dictionaryRepository = dictionaryRepository;
        this.openAiClient = openAiClient;
        this.usageRepository = usageRepository;
    }

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

        if(!usage.canSearch() && !usage.canBonusSearch())throw new TooManyRequestsException("You have reached today's search limit");

        Optional<DictionaryWord> queryWordDataResult = dictionaryRepository.queryWordData(searchWord);
        //検索ロジック
        if(queryWordDataResult.isPresent()) {
            long id = queryWordDataResult.get().getId();
            String word = queryWordDataResult.get().getNormalizedWord();
            List<WordEntry> entries = dictionaryRepository.queryWordEntriesData(id);

            //検索回数更新
            if(searchContext.getGuestId() != null) {
                if(usage.canSearch()) {
                    usage.consume();
                    usageRepository.updateGuestUsage((GuestUsageCount) usage);
                } else {
                    usage.consumeBonus();
                    usageRepository.updateBonusGuestUsage((GuestUsageCount) usage);
                }
            } else {
                if(usage.canSearch()) {
                    usage.consume();
                    usageRepository.updateUserUsage((UserUsageCount) usage);
                } else {
                    usage.consumeBonus();
                    usageRepository.updateBonusUserUsage((UserUsageCount) usage);
                }
            }

            return new WordResponse(word, entries, "SUCCESS");
        } else {
            OpenAiResponse openAiResult = openAiClient.fetchWordData(searchWord);
            String inputWord = openAiResult.getInputWord();
            String resolvedWord = openAiResult.getResolvedWord();
            List<String> candidates = openAiResult.getCandidates();
            List<WordEntry> entries = openAiResult.getEntries();
            if(resolvedWord ==  null || !inputWord.equalsIgnoreCase(resolvedWord)) {
                //スペルミスなどでcandidatesに値が3つあるパターン
                return new WordResponse(inputWord, candidates, entries,"SPELLING_SUSPECTED");
            } else {
                String normalized = resolvedWord.trim().toLowerCase();
                long id = dictionaryRepository.createWordData(normalized);
                dictionaryRepository.createEntriesData(id, entries);
                //検索回数更新
                if(searchContext.getGuestId() != null) {
                    if(usage.canSearch()) {
                        usage.consume();
                        usageRepository.updateGuestUsage((GuestUsageCount) usage);
                    } else {
                        usage.consumeBonus();
                        usageRepository.updateBonusGuestUsage((GuestUsageCount) usage);
                    }
                } else {
                    if(usage.canSearch()) {
                        usage.consume();
                        usageRepository.updateUserUsage((UserUsageCount) usage);
                    } else {
                        usage.consumeBonus();
                        usageRepository.updateBonusUserUsage((UserUsageCount) usage);
                    }
                }
                return new WordResponse(normalized, candidates, entries, "SUCCESS");
            }
        }
    }
}
