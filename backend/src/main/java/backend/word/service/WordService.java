package backend.word.service;

import java.util.List;

import org.springframework.stereotype.Service;

import backend.word.domain.Word;
import backend.word.repository.WordRepository;

@Service
public class WordService {
    private WordRepository wordRepository;

    public WordService(WordRepository wordRepository) {
        this.wordRepository = wordRepository;
    }

    public List<Word> getWords(long userId) {
        return wordRepository.getWords(userId);
    }

    public Word getWord(long userId, long wordId) {
        return wordRepository.getWord(userId, wordId);
    }

    public void createWord(Word newWord) {
        wordRepository.createWord(newWord);
    }

    public void updateWord(Word updatedWord) {
        wordRepository.updateWord(updatedWord);
    }

    public void deleteWord(long userId, long wordId) {
        wordRepository.deleteWord(userId, wordId);
    }
}
