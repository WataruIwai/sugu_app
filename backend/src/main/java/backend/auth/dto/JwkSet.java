package backend.auth.dto;

import java.util.List;

public class JwkSet {
    private List<JwkKey> keys;

    public JwkSet() {}

    public List<JwkKey> getKeys() {
        return keys;
    }

    public void setKeys(List<JwkKey> keys) {
        this.keys = keys;
    }
}
