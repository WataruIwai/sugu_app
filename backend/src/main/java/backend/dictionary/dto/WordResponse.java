package backend.dictionary.dto;

import java.util.List;

public class WordResponse {
    private String word;
    private List<String> candidates;
    List<WordEntry> entries;
    private String status;

    public WordResponse() {
    }

    public WordResponse(String word, List<WordEntry> entries, String status) {
        this.word = word;
        this.entries = entries;
        this.status = status;
    }

    public WordResponse(String word, List<String> candidates, List<WordEntry> entries, String status) {
        this.word = word;
        this.candidates = candidates;
        this.entries = entries;
        this.status = status;
    }

    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }

    public List<String> getCandidates() { return candidates; }
    public void setCandidates(List<String> candidates) { this.candidates = candidates; }

    public List<WordEntry> getEntries() { return entries; }
    public void setEntries(List<WordEntry> entries) { this.entries = entries; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}