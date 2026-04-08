import { useEffect, useMemo, useState } from "react";

import {
  deleteAuthToken,
  getAuthToken,
  saveAuthToken,
} from "./src/auth/tokenStorage";
import { SignInPage } from "./src/pages/SignInPage";
import { SignUpPage } from "./src/pages/SignUpPage";
import { VocabularyListPage } from "./src/pages/VocabularyListPage";
import { WordDetailPage } from "./src/pages/WordDetailPage";
import { WordItem } from "./src/types";

const API_BASE_URL = "http://192.168.1.9:8080";

type Screen = "signin" | "signup" | "list" | "detail";

const normalizeToken = (raw: string) => raw.trim().replace(/^"|"$/g, "");

export default function App() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [token, setToken] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");

    const [words, setWords] = useState<WordItem[]>([]);
    const [selectedWord, setSelectedWord] = useState<WordItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const authenticated = useMemo(() => Boolean(token), [token]);

    const fetchWords = async (currentToken: string) => {
        const response = await fetch(`${API_BASE_URL}/words`, {
            headers: {
                Authorization: `Bearer ${currentToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("単語一覧の取得に失敗しました。");
        }

        const data = (await response.json()) as WordItem[];
        setWords(data);
    };

    const fetchWordDetail = async (wordId: number, currentToken: string) => {
        const response = await fetch(`${API_BASE_URL}/words/${wordId}`, {
            headers: {
                Authorization: `Bearer ${currentToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("単語詳細の取得に失敗しました。");
        }

        const data = (await response.json()) as WordItem;
        setSelectedWord(data);
        setScreen("detail");
    };

    const handleSignIn = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputMail: signInEmail,
                    inputPassword: signInPassword,
                }),
            });

            if (!response.ok) {
                throw new Error("ログインに失敗しました。");
            }

      const currentToken = normalizeToken(await response.text());
      await saveAuthToken(currentToken);
      setToken(currentToken);
      await fetchWords(currentToken);
      setScreen("list");
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "ログインに失敗しました。",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputMail: signUpEmail,
                    inputPassword: signUpPassword,
                }),
            });

            if (!response.ok) {
                throw new Error("アカウント作成に失敗しました。");
            }

      const currentToken = normalizeToken(await response.text());
      await saveAuthToken(currentToken);
      setToken(currentToken);
      await fetchWords(currentToken);
      setScreen("list");
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "アカウント作成に失敗しました。",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshWords = async () => {
        if (!token) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            await fetchWords(token);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "単語一覧の取得に失敗しました。",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSelectWord = async (wordId: number) => {
        if (!token) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            await fetchWordDetail(wordId, token);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "単語詳細の取得に失敗しました。",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBackToList = () => {
        setSelectedWord(null);
        setScreen("list");
    };

  const handleLogout = async () => {
    await deleteAuthToken();
    setToken(null);
    setWords([]);
    setSelectedWord(null);
    setErrorMessage(null);
    setScreen("signin");
  };

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const storedToken = await getAuthToken();

        if (!storedToken) {
          return;
        }

        const currentToken = normalizeToken(storedToken);
        setToken(currentToken);
        await fetchWords(currentToken);
        setScreen("list");
      } catch (error) {
        await deleteAuthToken();
        setToken(null);
        setWords([]);
        setSelectedWord(null);
        setScreen("signin");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "ログイン状態の復元に失敗しました。",
        );
      } finally {
        setBootstrapping(false);
      }
    };

    void restoreAuth();
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return;
        }

        if (screen === "list" && words.length === 0) {
            void handleRefreshWords();
    }
  }, [authenticated, screen]);

  if (bootstrapping) {
    return (
      <SignInPage
        email=""
        password=""
        loading
        errorMessage={null}
        onChangeEmail={() => {}}
        onChangePassword={() => {}}
        onSubmit={() => {}}
        onNavigateSignUp={() => {}}
      />
    );
  }

    if (screen === "signup") {
        return (
            <SignUpPage
                email={signUpEmail}
                password={signUpPassword}
                loading={loading}
                errorMessage={errorMessage}
                onChangeEmail={setSignUpEmail}
                onChangePassword={setSignUpPassword}
                onSubmit={handleSignUp}
                onNavigateSignIn={() => {
                    setErrorMessage(null);
                    setScreen("signin");
                }}
            />
        );
    }

    if (screen === "list") {
        return (
            <VocabularyListPage
                words={words}
                loading={loading}
                errorMessage={errorMessage}
                onPressWord={handleSelectWord}
                onRefresh={handleRefreshWords}
                onLogout={handleLogout}
            />
        );
    }

    if (screen === "detail" && selectedWord) {
        return (
            <WordDetailPage
                word={selectedWord}
                onBack={handleBackToList}
                onLogout={handleLogout}
            />
        );
    }

    return (
        <SignInPage
            email={signInEmail}
            password={signInPassword}
            loading={loading}
            errorMessage={errorMessage}
            onChangeEmail={setSignInEmail}
            onChangePassword={setSignInPassword}
            onSubmit={handleSignIn}
            onNavigateSignUp={() => {
                setErrorMessage(null);
                setScreen("signup");
            }}
        />
    );
}
