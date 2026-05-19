package backend.dictionary.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

    public DictionaryController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    @PostMapping("/search")
    public WordResponse search(@RequestBody WordRequest request,
        @AuthenticationPrincipal SearchContext searchContext
    ) {
        if(searchContext.getUserId() != null) {
            return dictionaryService.getWordData(request.getWord(), searchContext);
        } else if( searchContext.getGuestId() != null) {
            return dictionaryService.getWordData(request.getWord(), searchContext);
        } else {
            throw new UnauthorizedException("Authentication required");
        }
    }
}
