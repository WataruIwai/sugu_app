package backend.word.domain;

public class Word {
    private long id;
    private long userId;
    private String word;
    private String meaning;
    private String memo;
    private String pronunciation;

    public Word(long id, long userId, String word, String meaning, String memo, String pronunciation) {
        this.id = id;
        this.userId = userId;
        this.word = word;
        this.meaning = meaning;
        this.memo = memo;
        this.pronunciation = pronunciation;
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

    public String getMeaning() {
        return meaning;
    }

    public String getMemo() {
        return memo;
    }

    public String getPronunciation() {
        return pronunciation;
    }
}
