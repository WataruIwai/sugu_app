package backend.dictionary.dto;

public class  DictionaryWord {
    private long id;
    private String word;
    private String normalizedWord;

    public DictionaryWord(long id, String word, String normalizedWord) {
        this.id = id;
        this.word = word;
        this.normalizedWord = normalizedWord;
    }

    public long getId() {
        return id;
    }

    public String getNormalizedWord() {
        return normalizedWord;
    }
}
