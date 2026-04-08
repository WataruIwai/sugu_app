package backend.dictionary.controller;

import org.springframework.web.bind.annotation.*;

import backend.auth.jwt.JwtService;
import backend.dictionary.dto.WordRequest;
import backend.dictionary.dto.WordResponse;
import backend.dictionary.service.DictionaryService;

@RestController
@RequestMapping("/api/dictionary")
public class DictionaryController {

    private final DictionaryService dictionaryService;
    private JwtService jwtService;

    public DictionaryController(DictionaryService dictionaryService, JwtService jwtService) {
        this.dictionaryService = dictionaryService;
        this.jwtService = jwtService;
    }

    @PostMapping("/search")
    public WordResponse search(@RequestBody WordRequest request, @RequestHeader("Authorization") String authorizationHeader) {
        Long userId = jwtService.extractUserIdFromHeader(authorizationHeader);
        if(userId == null) throw new RuntimeException("ログインしてください");
        return dictionaryService.getWordData(request.getWord());
    }
}