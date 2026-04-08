package backend.dictionary.domain;

public class DictionaryEntry {
    private Long id;
    private String word;
    private String meaning;
    private String japanese;
    private String example;

    public DictionaryEntry(Long id, String word, String meaning, String japanese, String example) {
        this.id = id;
        this.word = word;
        this.meaning = meaning;
        this.japanese = japanese;
        this.example = example;
    }

    public Long getId() {
        return id;
    }

    public String getWord() {
        return word;
    }

    public String getMeaning() {
        return meaning;
    }

    public String getJapanese() {
        return japanese;
    }

    public String getExample() {
        return example;
    }
}
