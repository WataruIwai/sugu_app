package backend.dictionary.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import backend.dictionary.domain.DictionaryEntry;
import backend.dictionary.dto.DictionaryWord;
import backend.dictionary.dto.WordEntry;
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
        Optional<DictionaryWord> queryWordDataResult = dictionaryRepository.queryWordData(searchWord);
        if(queryWordDataResult.isPresent()) {
            long id = queryWordDataResult.get().getId();
            String word = queryWordDataResult.get().getNormalizedWord();
            List<WordEntry> entries = dictionaryRepository.queryWordEntriesData(id);

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
                //open ai apiが正常に意味を出力した時
                String normalized = resolvedWord.trim().toLowerCase();
                long id = dictionaryRepository.createWordData(normalized);
                dictionaryRepository.createEntriesData(id, entries);
                //登録して、そのデータを取得して返すのがいいかも
                return new WordResponse(normalized, candidates, entries, "SUCCESS");
            }
        }
    }
}
