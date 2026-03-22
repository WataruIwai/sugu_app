package backend.word.controller;

import java.util.List;

import backend.word.domain.Word;
import backend.word.service.WordService;

public class WordController {
    private WordService wordService;

    public WordController(WordService wordService) {
        this.wordService = wordService;
    }

    public List<Word> getWords(long userId) {
        return wordService.getWords(userId);
    }

    public Word getWord(long userId, long wordId) {
        return wordService.getWord(userId, wordId);
    }

    public void createWord(Word newWord) {
        wordService.createWord(newWord);
    }

    public void updateWord(Word updateWord) {
        wordService.updateWord(updateWord);
    }

    public void deleteWord(long userId, long wordId) {
        wordService.deleteWord(userId, wordId);
    }
}
