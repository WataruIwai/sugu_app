package backend.external.dto;

import java.util.List;

public class OpenAiResponse {
    private String inputWord;
    private List<String> candidates;
    private String resolvedWord;
    private String meaning;
    private String japanese;
    private String example;

    public OpenAiResponse(){}

    public String getInputWord() { return inputWord; }
    public void setInputWord(String inputWord) { this.inputWord = inputWord; }

    public List<String> getCandidates() { return candidates; }
    public void setCandidates(List<String> candidates) { this.candidates = candidates; }


    public String getResolvedWord() { return resolvedWord; }
    public void setResolvedWord(String resolvedWord) { this.resolvedWord = resolvedWord; }

    public String getMeaning() { return meaning; }
    public void setMeaning(String meaning) { this.meaning = meaning; }

    public String getJapanese() { return japanese; }
    public void setJapanese(String japanese) { this.japanese = japanese; }

    public String getExample() { return example; }
    public void setExample(String example) { this.example = example; }
}
