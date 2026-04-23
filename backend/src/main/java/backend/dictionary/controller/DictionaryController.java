package backend.dictionary.controller;

import org.springframework.web.bind.annotation.*;

import backend.auth.jwt.JwtService;
import backend.dictionary.dto.WordRequest;
import backend.dictionary.dto.WordResponse;
import backend.dictionary.service.DictionaryService;
import backend.dictionary.util.SearchContext;
import backend.exception.UnauthorizedException;

//検索は未ログインユーザーも可能
@RestController
@RequestMapping("/api/dictionary")
public class DictionaryController {

    private final DictionaryService dictionaryService;
    private final JwtService jwtService;

    public DictionaryController(DictionaryService dictionaryService, JwtService jwtService) {
        this.dictionaryService = dictionaryService;
        this.jwtService = jwtService;
    }

    @PostMapping("/search")
    public WordResponse search(@RequestBody WordRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Guest-Id", required = false) String guestId) {
        if(authorizationHeader != null) {
            String token = authorizationHeader.replace("Bearer ", "");
            Long userId = jwtService.extractUserId(token);
            SearchContext searchContext = SearchContext.forUser(userId);
            return dictionaryService.getWordData(request.getWord(), searchContext);
        } else if( guestId != null) {
            SearchContext searchContext = SearchContext.forGuest(guestId);
            return dictionaryService.getWordData(request.getWord(), searchContext);
        } else {
            throw new UnauthorizedException("Authentication required");
        }
    }
}
