package backend.auth.dto;



public class JwkKey {
    private String kid;
    private String kty;
    private String n;
    private String e;

    public JwkKey() {}

    public String getKid() { return kid; }
    public void setKid(String kid) { this.kid = kid; }

    public String getKty() { return kty; }
    public void setKty(String kty) { this.kty = kty; }

    public String getN() { return n; }
    public void setN(String n) { this.n = n; }

    public String getE() { return e; }
    public void setE(String e) { this.e = e; }
}