package backend.dictionary.dto;

public class WordEntry {
    private String meaning;
    private String japanese;
    private String example;

    public WordEntry() {}

    public WordEntry(String meaning, String japanese, String example) {
        this.meaning = meaning;
        this.japanese = japanese;
        this.example = example;
    }

    public String getMeaning() { return meaning; }
    public void setMeaning(String meaning) { this.meaning = meaning; }

    public String getJapanese() { return japanese; }
    public void setJapanese(String japanese) { this.japanese = japanese; }

    public String getExample() { return example; }
    public void setExample(String example) { this.example = example; }
}
