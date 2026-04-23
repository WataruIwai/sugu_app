package backend.dictionary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class WordEntry {
    @JsonProperty("meaning_en")
    private String meaningEn;

    @JsonProperty("meaning_ja")
    private String meaningJa;

    private String example;

    public WordEntry() {}

    public WordEntry(String meaningEn, String meaningJa, String example) {
        this.meaningEn = meaningEn;
        this.meaningJa = meaningJa;
        this.example = example;
    }

    public String getMeaning() { return meaningEn; }
    public void setMeaning(String meaningEn) { this.meaningEn = meaningEn; }

    public String getJapanese() { return meaningJa; }
    public void setJapanese(String meaningJa) { this.meaningJa = meaningJa; }

    public String getExample() { return example; }
    public void setExample(String example) { this.example = example; }

    @Override
    public String toString() {
        return "WordEntry{" +
                "meaning_en='" + meaningEn + '\'' +
                ", meaning_ja='" + meaningJa + '\'' +
                ", example='" + example + '\'' +
                '}';
    }
}
