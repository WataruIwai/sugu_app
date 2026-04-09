package backend.external.dto;

import java.util.List;

import backend.dictionary.dto.WordEntry;

public class OpenAiResponse {
    private String inputWord;
    private List<String> candidates;
    private String resolvedWord;
    private List<WordEntry> entries;

    public OpenAiResponse(){}

    public String getInputWord() { return inputWord; }
    public void setInputWord(String inputWord) { this.inputWord = inputWord; }

    public List<String> getCandidates() { return candidates; }
    public void setCandidates(List<String> candidates) { this.candidates = candidates; }


    public String getResolvedWord() { return resolvedWord; }
    public void setResolvedWord(String resolvedWord) { this.resolvedWord = resolvedWord; }

    public List<WordEntry> getEntries() { return entries; }
    public void setEntries(List<WordEntry> entries) { this.entries = entries; }
}
