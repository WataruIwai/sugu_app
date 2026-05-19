package backend.word.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.dictionary.util.SearchContext;
import backend.word.domain.Word;
import backend.word.domain.WordDetail;
import backend.word.service.WordService;

@RestController
@RequestMapping("/words")
public class WordController {
    private WordService wordService;

    public WordController(WordService wordService) {
        this.wordService = wordService;
    }

    @GetMapping
    public List<Word> getWords(@AuthenticationPrincipal SearchContext searchContext) {
        long userId = searchContext.getUserId();
        return wordService.getWords(userId);
    }

    @GetMapping("/{wordId}")
    public WordDetail getWord(@AuthenticationPrincipal SearchContext searchContext, @PathVariable long wordId) {
        long userId = searchContext.getUserId();
        return wordService.getWord(wordId, userId);
    }

    @PostMapping
    public void createWord(@AuthenticationPrincipal SearchContext searchContext, @RequestBody Word newWord) {
        long userId = searchContext.getUserId();
        newWord.setUserId(userId);
        wordService.createWord(newWord);
    }

    @DeleteMapping("/{wordId}")
    public void deleteWord(@AuthenticationPrincipal SearchContext searchContext, @PathVariable long wordId) {
        long userId = searchContext.getUserId();
        wordService.deleteWord(wordId, userId);
    }
}
