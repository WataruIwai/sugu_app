package backend.word.service;

import java.util.List;

import backend.word.domain.Word;
import backend.word.repository.WordRepository;

public class WordService {
    // 単語に関するユースケースを担当するサービス。
    // Controller から受け取ったデータをもとに処理を行い、必要に応じて Repository を使ってデータを取得・保存する。
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
