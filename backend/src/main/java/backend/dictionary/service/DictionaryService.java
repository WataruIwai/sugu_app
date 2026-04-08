package backend.dictionary.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import backend.dictionary.domain.DictionaryEntry;
import backend.dictionary.dto.WordResponse;
import backend.dictionary.repository.DictionaryRepository;
import backend.external.OpenAiClient;
import backend.external.dto.OpenAiResponse;

@Service
public  class DictionaryService {
    private DictionaryRepository dictionaryRepository;
    private OpenAiClient openAiClient;

    public DictionaryService(DictionaryRepository dictionaryRepository, OpenAiClient openAiClient) {
        this.dictionaryRepository = dictionaryRepository;
        this.openAiClient = openAiClient;
    }

    public WordResponse getWordData(String searchWord) {
        Optional<DictionaryEntry> queryWordDataResult = dictionaryRepository.queryWordData(searchWord);
        if(queryWordDataResult.isPresent()) {
            String word = queryWordDataResult.get().getWord();
            String meaning = queryWordDataResult.get().getMeaning();
            String japanese = queryWordDataResult.get().getJapanese();
            String example = queryWordDataResult.get().getExample();

            return new WordResponse(word, meaning, japanese, example, "SUCCESS");
        } else {
            OpenAiResponse openAiResult = openAiClient.fetchWordData(searchWord);
            String inputWord = openAiResult.getInputWord();
            String resolvedWord = openAiResult.getResolvedWord();
            List<String> candidates = openAiResult.getCandidates();
            String meaning = openAiResult.getMeaning();
            String japanese = openAiResult.getJapanese();
            String example = openAiResult.getExample();
            if(resolvedWord ==  null || !inputWord.equalsIgnoreCase(resolvedWord)) {
                return new WordResponse(resolvedWord, candidates, meaning, japanese, example, "SPELLING_SUSPECTED");
            } else {
                dictionaryRepository.createWordData(resolvedWord, meaning, japanese, example);
                return new WordResponse(resolvedWord, meaning, japanese, example, "SUCCESS");
            }
        }
    }
}
