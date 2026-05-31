package backend.word.domain;

import backend.dictionary.dto.WordEntry;
import java.util.List;

public class WordDetail {
  private final String word;
  private List<WordEntry> entries;

  public WordDetail(String word, List<WordEntry> entries) {
    this.word = word;
    this.entries = entries;
  }

  public String getWord() {
    return word;
  }

  public List<WordEntry> getEntries() {
    return entries;
  }
}
