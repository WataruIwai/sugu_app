package backend.word.domain;

public class Word {
    private long id;
    private long userId;
    private String word;
    private long dictionaryWordId;

    public Word() {
    }

    public Word(long id, long userId, String word, long dictionaryWordId) {
        this.id = id;
        this.userId = userId;
        this.word = word;
        this.dictionaryWordId = dictionaryWordId;
    }

    public long getId() {
        return id;
    }

    public long getUserId() {
        return userId;
    }

    public String getWord() {
        return word;
    }

    public long getDictionaryWordId() {
        return dictionaryWordId;
    }

    public void setId(long wordId) {
        this.id = wordId;
    }
    public void setUserId(long userId) {
        this.userId = userId;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public void setDictionaryWordId(long dictionaryWordId) {
        this.dictionaryWordId = dictionaryWordId;
    }
}
