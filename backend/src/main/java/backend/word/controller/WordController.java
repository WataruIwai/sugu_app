package backend.word.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.auth.jwt.JwtService;
import backend.word.domain.Word;
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
        long userId = extractUserIdFromHeader(authorizationHeader);
        return wordService.getWords(userId);
    }

    @GetMapping("/{wordId}")
    public Word getWord(@RequestHeader("Authorization") String authorizationHeader, @PathVariable long wordId) {
        long userId = extractUserIdFromHeader(authorizationHeader);
        return wordService.getWord(userId, wordId);
    }

    @PostMapping
    public void createWord(@RequestHeader("Authorization") String authorizationHeader, @RequestBody Word newWord) {
        long userId = extractUserIdFromHeader(authorizationHeader);
        newWord.setUserId(userId);
        wordService.createWord(newWord);
    }

    @PutMapping("/{wordId}")
    public void updateWord(@RequestHeader("Authorization") String authorizationHeader, @PathVariable long wordId, @RequestBody Word updateWord) {
        long userId = extractUserIdFromHeader(authorizationHeader);
        updateWord.setId(wordId);
        updateWord.setUserId(userId);
        wordService.updateWord(updateWord);
    }

    @DeleteMapping("/{wordId}")
    public void deleteWord(@RequestHeader("Authorization") String authorizationHeader, @PathVariable long wordId) {
        long userId = extractUserIdFromHeader(authorizationHeader);
        wordService.deleteWord(userId, wordId);
    }

    private long extractUserIdFromHeader(String authorizationHeader) {
        String token = authorizationHeader.replace("Bearer ", "");
        if (jwtService.isTokenValid(token)) {
            return jwtService.extractUserId(token);
        }

        throw new RuntimeException("再度ログインしてください");
    }
}
