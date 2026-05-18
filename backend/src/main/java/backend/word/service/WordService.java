package backend.word.service;

import java.util.List;
import org.springframework.stereotype.Service;

import backend.dictionary.dto.WordEntry;
import backend.dictionary.dto.DictionaryWord;
import backend.dictionary.repository.DictionaryRepository;
import backend.exception.NotFoundException;
import backend.word.domain.Word;
import backend.word.domain.WordDetail;
import backend.word.repository.WordRepository;

@Service
public class WordService {
    private WordRepository wordRepository;
    private DictionaryRepository dictionaryRepository;

    public WordService(WordRepository wordRepository, DictionaryRepository dictionaryRepository) {
        this.wordRepository = wordRepository;
        this.dictionaryRepository = dictionaryRepository;
    }

    public List<Word> getWords(long userId) {
        return wordRepository.getWords(userId);
    }

    public WordDetail getWord(long wordId, long userId) {
        Word usersWord = wordRepository.getWord(wordId, userId)
                .orElseThrow(() -> new NotFoundException("Word not found. wordId=" + wordId + ", userId" + userId));
        List<WordEntry> wordEntries = dictionaryRepository.queryWordEntriesData(usersWord.getDictionaryWordId());
        return new WordDetail(usersWord.getWord(), wordEntries);
    }

    public void createWord(Word newWord) {
        String normalizedWord = newWord.getWord().trim().toLowerCase();
        DictionaryWord dictionaryWord = dictionaryRepository.queryWordData(normalizedWord)
                .orElseThrow(() -> new IllegalStateException("Dictionary data should exist when saving a searched word."));
        newWord.setWord(dictionaryWord.getNormalizedWord());
        newWord.setDictionaryWordId(dictionaryWord.getId());
        wordRepository.createWord(newWord);
    }

    public void deleteWord(long wordId, long userId) {
        wordRepository.deleteWord(wordId, userId);
    }
}
