package backend.dictionary.dto;

import java.util.List;

public class WordResponse {
    private String word;
    private List<String> candidates;
    private String meaning;
    private String japanese;
    private String example;
    private String status;

    public WordResponse() {
    }

    public WordResponse(String word, String meaning, String japanese, String example, String status) {
        this.word = word;
        this.meaning = meaning;
        this.japanese = japanese;
        this.example = example;
        this.status = status;
    }

    public WordResponse(String word, List<String> candidates, String meaning, String japanese, String example, String status) {
        this.word = word;
        this.candidates = candidates;
        this.meaning = meaning;
        this.japanese = japanese;
        this.example = example;
        this.status = status;
    }

    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }

    public List<String> getCandidates() { return candidates; }
    public void setCandidates(List<String> candidates) { this.candidates = candidates; }

    public String getMeaning() { return meaning; }
    public void setMeaning(String meaning) { this.meaning = meaning; }

    public String getJapanese() { return japanese; }
    public void setJapanese(String japanese) { this.japanese = japanese; }

    public String getExample() { return example; }
    public void setExample(String example) { this.example = example; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}