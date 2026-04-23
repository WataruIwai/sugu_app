package backend.word.controller;

import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.auth.jwt.JwtService;
import backend.word.domain.Word;
import backend.word.domain.WordDetail;
import backend.word.service.WordService;

@RestController
@RequestMapping("/words")
public class WordController {
    private WordService wordService;
    private JwtService jwtService;

    public WordController(WordService wordService, JwtService jwtService) {
        this.wordService = wordService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public List<Word> getWords(@RequestHeader("Authorization") String authorizationHeader) {
        long userId = jwtService.extractUserIdFromHeader(authorizationHeader);
        return wordService.getWords(userId);
    }

    @GetMapping("/{wordId}")
    public WordDetail getWord(@RequestHeader("Authorization") String authorizationHeader, @PathVariable long wordId) {
        long userId = jwtService.extractUserIdFromHeader(authorizationHeader);
        return wordService.getWord(wordId, userId);
    }

    @PostMapping
    public void createWord(@RequestHeader("Authorization") String authorizationHeader, @RequestBody Word newWord) {
        long userId = jwtService.extractUserIdFromHeader(authorizationHeader);
        newWord.setUserId(userId);
        wordService.createWord(newWord);
    }

    @DeleteMapping("/{wordId}")
    public void deleteWord(@RequestHeader("Authorization") String authorizationHeader, @PathVariable long wordId) {
        long userId = jwtService.extractUserIdFromHeader(authorizationHeader);
        wordService.deleteWord(wordId, userId);
    }
}
