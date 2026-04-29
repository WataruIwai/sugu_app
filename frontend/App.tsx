import { useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import {
    getTrackingPermissionsAsync,
    requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";

import {
    getAttPermissionRequested,
    deleteAuthToken,
    getGuestId,
    getAuthToken,
    saveAttPermissionRequested,
    saveGuestId,
    saveAuthToken,
} from "./src/auth/tokenStorage";
import {
    canUseRewardedSearchBonusAd,
    showRewardedSearchBonusAd,
} from "./src/ads/rewardedSearchBonus";
import { SignInPage } from "./src/pages/SignInPage";
import { SignUpPage } from "./src/pages/SignUpPage";
import { UpdateEmailPage } from "./src/pages/UpdateEmailPage";
import { UpdatePasswordPage } from "./src/pages/UpdatePasswordPage";
import { VocabularyListPage } from "./src/pages/VocabularyListPage";
import { WordDetailPage } from "./src/pages/WordDetailPage";
import { SearchPage } from "./src/pages/SearchPage";
import { BootSplashPage } from "./src/pages/BootSplashPage";
import { SearchResult, WordDetailItem, WordItem } from "./src/types";

const API_BASE_URL = "http://192.168.1.27:8080";

type Screen =
    | "signin"
    | "signup"
    | "list"
    | "detail"
    | "search"
    | "changeEmail"
    | "changePassword";
type SearchReturnScreen = "signin" | "list" | "detail";

const normalizeToken = (raw: string) => raw.trim().replace(/^"|"$/g, "");
const MIN_BOOT_SPLASH_DURATION_MS = 2000;

export default function App() {
    const bootStartedAtRef = useRef(Date.now());
    const [screen, setScreen] = useState<Screen>("signin");
    const [token, setToken] = useState<string | null>(null);
    const [guestId, setGuestId] = useState<string | null>(null);
    const [bootstrapping, setBootstrapping] = useState(true);

    const [signInEmail, setSignInEmail] = useState("");
    const [signInPassword, setSignInPassword] = useState("");
    const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
    const [signUpAgreedToTerms, setSignUpAgreedToTerms] = useState(false);

    const [updateEmailValue, setUpdateEmailValue] = useState("");
    const [updateEmailLoading, setUpdateEmailLoading] = useState(false);
    const [updateEmailErrorMessage, setUpdateEmailErrorMessage] = useState<
        string | null
    >(null);
    const [updateEmailSuccessMessage, setUpdateEmailSuccessMessage] = useState<
        string | null
    >(null);

    const [currentPasswordValue, setCurrentPasswordValue] = useState("");
    const [newPasswordValue, setNewPasswordValue] = useState("");
    const [updatePasswordLoading, setUpdatePasswordLoading] = useState(false);
    const [updatePasswordErrorMessage, setUpdatePasswordErrorMessage] =
        useState<string | null>(null);
    const [updatePasswordSuccessMessage, setUpdatePasswordSuccessMessage] =
        useState<string | null>(null);

    const [words, setWords] = useState<WordItem[]>([]);
    const [selectedWord, setSelectedWord] = useState<WordDetailItem | null>(
        null,
    );
    const [searchText, setSearchText] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [addToListLoading, setAddToListLoading] = useState(false);
    const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(
        null,
    );
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [searchReturnScreen, setSearchReturnScreen] =
        useState<SearchReturnScreen>("list");

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [listMenuOpen, setListMenuOpen] = useState(false);

    const [guestUpgradePromptVisible, setGuestUpgradePromptVisible] =
        useState(false);
    const [guestUpgradePromptTitle, setGuestUpgradePromptTitle] =
        useState("アカウントを作成しませんか？");
    const [guestUpgradePromptMessage, setGuestUpgradePromptMessage] =
        useState("");
    const [searchBonusPromptVisible, setSearchBonusPromptVisible] =
        useState(false);
    const [searchBonusPromptLoading, setSearchBonusPromptLoading] =
        useState(false);
    const [searchBonusPromptTitle, setSearchBonusPromptTitle] = useState("");
    const [searchBonusPromptMessage, setSearchBonusPromptMessage] =
        useState("");
    const [searchBonusPromptErrorMessage, setSearchBonusPromptErrorMessage] =
        useState<string | null>(null);
    const [attCheckCompleted, setAttCheckCompleted] = useState(false);

    const authenticated = useMemo(() => Boolean(token), [token]);
    const guestMode = useMemo(
        () => !token && Boolean(guestId),
        [guestId, token],
    );

    const buildGuestId = () =>
        `guest_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

    const fetchWords = async (currentToken: string) => {
        console.log("Fetch words started.");
        const response = await fetch(`${API_BASE_URL}/words`, {
            headers: {
                Authorization: `Bearer ${currentToken}`,
            },
        });

        console.log("Fetch words response received:", response.status);

        if (!response.ok) {
            const rawResponseText = await response.text();
            console.log("Fetch words response status:", response.status);
            console.log("Fetch words response body:", rawResponseText);
            throw new Error("単語一覧の取得に失敗しました。");
        }

        const data = (await response.json()) as WordItem[];
        console.log("Fetch words response data:", data);
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

        const data = (await response.json()) as WordDetailItem;
        setSelectedWord(data);
        setScreen("detail");
    };

    const openGuestUpgradePrompt = (title: string, message: string) => {
        setSearchBonusPromptVisible(false);
        setSearchBonusPromptErrorMessage(null);
        setGuestUpgradePromptTitle(title);
        setGuestUpgradePromptMessage(message);
        setGuestUpgradePromptVisible(true);
    };

    const handleCloseGuestUpgradePrompt = () => {
        setGuestUpgradePromptVisible(false);
    };

    const openSearchBonusPrompt = (title: string, message: string) => {
        setGuestUpgradePromptVisible(false);
        setSearchBonusPromptTitle(title);
        setSearchBonusPromptMessage(message);
        setSearchBonusPromptErrorMessage(null);
        setSearchBonusPromptVisible(true);
    };

    const handleCloseSearchBonusPrompt = () => {
        if (searchBonusPromptLoading) {
            return;
        }

        setSearchBonusPromptVisible(false);
        setSearchBonusPromptErrorMessage(null);
    };

    const handleNavigateSignUpFromGuestPrompt = () => {
        setGuestUpgradePromptVisible(false);
        setErrorMessage(null);
        setScreen("signup");
    };

    const handleSignIn = async () => {
        setLoading(true);
        setErrorMessage(null);
        console.log("Handle sign in started.");
        console.log("Sign in target:", `${API_BASE_URL}/auth/signin`);
        console.log("Sign in email:", signInEmail);

        try {
            console.log("Sign in request sending...");
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

            console.log("Sign in response received:", response.status);

            if (!response.ok) {
                const rawResponseText = await response.text();
                console.log("Sign in failed response body:", rawResponseText);
                throw new Error("ログインに失敗しました。");
            }

            const currentToken = normalizeToken(await response.text());
            console.log("Sign in succeeded. token acquired.");
            console.log("Token length:", currentToken.length);
            console.log("Saving auth token...");
            await saveAuthToken(currentToken);
            console.log("Auth token saved.");
            setToken(currentToken);
            console.log("Token state updated.");
            setScreen("list");
            console.log("Screen changed to list.");
            await fetchWords(currentToken);
            console.log("Handle sign in completed.");
        } catch (error) {
            console.log("Handle sign in failed:", error);
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
            if (signUpPassword !== signUpConfirmPassword) {
                throw new Error("確認用パスワードが一致しません。");
            }

            if (!signUpAgreedToTerms) {
                throw new Error("利用規約への同意が必要です。");
            }

            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputMail: signUpEmail,
                    inputPassword: signUpPassword,
                    agreedToTerms: signUpAgreedToTerms,
                }),
            });

            if (!response.ok) {
                throw new Error("アカウント作成に失敗しました。");
            }

            const currentToken = normalizeToken(await response.text());
            console.log("Sign up succeeded. token acquired.");
            await saveAuthToken(currentToken);
            setToken(currentToken);
            setScreen("list");
            await fetchWords(currentToken);
        } catch (error) {
            console.log("Handle sign up failed:", error);
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

    const handleDeleteWord = async (wordId: number) => {
        if (!token) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/words/${wordId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("単語の削除に失敗しました。");
            }

            await fetchWords(token);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "単語の削除に失敗しました。",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBackToList = () => {
        setSelectedWord(null);
        setListMenuOpen(false);
        setScreen("list");
    };

    const handleOpenChangeEmail = () => {
        setUpdateEmailErrorMessage(null);
        setUpdateEmailSuccessMessage(null);
        setListMenuOpen(false);
        setScreen("changeEmail");
    };

    const handleOpenChangePassword = () => {
        setUpdatePasswordErrorMessage(null);
        setUpdatePasswordSuccessMessage(null);
        setListMenuOpen(false);
        setScreen("changePassword");
    };

    const handleBackFromChangeEmail = () => {
        setUpdateEmailErrorMessage(null);
        setUpdateEmailSuccessMessage(null);
        setListMenuOpen(true);
        setScreen("list");
    };

    const handleBackFromChangePassword = () => {
        setUpdatePasswordErrorMessage(null);
        setUpdatePasswordSuccessMessage(null);
        setListMenuOpen(true);
        setScreen("list");
    };

    const handleOpenSearch = (from: SearchReturnScreen) => {
        setSearchReturnScreen(from);
        setGuestUpgradePromptVisible(false);
        setSearchBonusPromptVisible(false);
        setSearchBonusPromptErrorMessage(null);
        setScreen("search");
    };

    const handleBackFromSearch = () => {
        setGuestUpgradePromptVisible(false);
        setSearchBonusPromptVisible(false);
        setSearchBonusPromptErrorMessage(null);
        setScreen(searchReturnScreen);
    };

    const handleDictionarySearch = async () => {
        if (!token && !guestId) {
            setSearchErrorMessage("ログインが必要です。");
            return;
        }

        const trimmed = searchText.trim();
        if (!trimmed) {
            setSearchErrorMessage("検索したい単語を入力してください。");
            setSearchResult(null);
            return;
        }

        setSearchLoading(true);
        setSearchErrorMessage(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/dictionary/search`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        ...(!token && guestId ? { "X-Guest-Id": guestId } : {}),
                    },
                    body: JSON.stringify({
                        word: trimmed,
                    }),
                },
            );

            const rawResponseText = await response.text();

            console.log("Dictionary search response status:", response.status);
            console.log("Dictionary search response body:", rawResponseText);

            if (!response.ok) {
                let serverMessage: string | null = null;

                try {
                    const errorData = JSON.parse(rawResponseText) as {
                        message?: string;
                    };
                    serverMessage = errorData.message ?? null;
                } catch {
                    serverMessage = null;
                }

                const isSearchLimitError =
                    response.status === 429 ||
                    serverMessage?.includes("上限") ||
                    serverMessage?.includes("search limit") ||
                    serverMessage?.includes("Too many requests");

                if (isSearchLimitError) {
                    setSearchErrorMessage(null);
                    openSearchBonusPrompt(
                        "本日の検索上限です",
                        canUseRewardedSearchBonusAd()
                            ? "広告を視聴すると、追加で3回検索できます。"
                            : "広告機能の準備ができていません。開発用ビルドで確認してください。",
                    );
                    return;
                }

                throw new Error(serverMessage ?? "検索に失敗しました。");
            }

            const data = JSON.parse(rawResponseText) as SearchResult;
            console.log(data);
            setSearchBonusPromptVisible(false);
            setSearchBonusPromptErrorMessage(null);
            setSearchResult(data);
        } catch (error) {
            setSearchErrorMessage(
                error instanceof Error ? error.message : "検索に失敗しました。",
            );
            setSearchResult(null);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddSearchResultToMyList = async () => {
        if (guestMode) {
            openGuestUpgradePrompt(
                "保存するにはアカウントが必要です",
                "My List に単語を保存したい場合は、アカウントを作成してください。作成後は検索結果を保存できるようになります。",
            );
            return false;
        }

        if (!token) {
            setSearchErrorMessage("ログインが必要です。");
            return false;
        }

        if (!searchResult || searchResult.status !== "SUCCESS") {
            setSearchErrorMessage("追加できる検索結果がありません。");
            return false;
        }

        setAddToListLoading(true);
        setSearchErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/words`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    word: searchResult.word,
                }),
            });

            if (!response.ok) {
                throw new Error("My List への追加に失敗しました。");
            }

            await fetchWords(token);
            return true;
        } catch (error) {
            setSearchErrorMessage(
                error instanceof Error
                    ? error.message
                    : "My List への追加に失敗しました。",
            );
            return false;
        } finally {
            setAddToListLoading(false);
        }
    };

    const handleChangeSearchText = (value: string) => {
        setSearchText(value);

        if (searchErrorMessage) {
            setSearchErrorMessage(null);
        }
    };

    const grantSearchBonus = async () => {
        const response = await fetch(`${API_BASE_URL}/api/usage/bonus`, {
            method: "POST",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(!token && guestId ? { "X-Guest-Id": guestId } : {}),
            },
        });

        if (!response.ok) {
            let serverMessage: string | null = null;

            try {
                const errorData = (await response.json()) as {
                    message?: string;
                };
                serverMessage = errorData.message ?? null;
            } catch {
                serverMessage = null;
            }

            throw new Error(
                serverMessage ??
                    "広告視聴後の特典反映に失敗しました。もう一度お試しください。",
            );
        }
    };

    const handleWatchSearchBonusAd = async () => {
        setSearchBonusPromptLoading(true);
        setSearchBonusPromptErrorMessage(null);

        try {
            const adResult = await showRewardedSearchBonusAd();

            if (adResult.status === "unavailable") {
                setSearchBonusPromptErrorMessage(adResult.message);
                return;
            }

            if (adResult.status === "error") {
                setSearchBonusPromptErrorMessage(adResult.message);
                return;
            }

            if (adResult.status === "dismissed") {
                setSearchBonusPromptErrorMessage(
                    "広告視聴が完了しませんでした。最後まで視聴すると検索回数が追加されます。",
                );
                return;
            }

            await grantSearchBonus();
            setSearchBonusPromptVisible(false);
            setSearchBonusPromptErrorMessage(null);
            setSearchErrorMessage(null);
            await handleDictionarySearch();
        } catch (error) {
            setSearchBonusPromptErrorMessage(
                error instanceof Error
                    ? error.message
                    : "広告視聴後の特典反映に失敗しました。もう一度お試しください。",
            );
        } finally {
            setSearchBonusPromptLoading(false);
        }
    };

    const handleLogout = async () => {
        await deleteAuthToken();
        setToken(null);
        setWords([]);
        setSelectedWord(null);
        setSearchText("");
        setSearchResult(null);
        setSearchErrorMessage(null);
        setErrorMessage(null);
        setListMenuOpen(false);
        setGuestUpgradePromptVisible(false);
        setSearchBonusPromptVisible(false);
        setSearchBonusPromptErrorMessage(null);
        setScreen("signin");
    };

    const handleUseGuest = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const storedGuestId = await getGuestId();
            const currentGuestId = storedGuestId ?? buildGuestId();

            if (!storedGuestId) {
                await saveGuestId(currentGuestId);
            }

            setGuestId(currentGuestId);
            setSearchText("");
            setSearchResult(null);
            setSearchErrorMessage(null);
            setGuestUpgradePromptVisible(false);
            setSearchBonusPromptVisible(false);
            handleOpenSearch("signin");
        } catch (error) {
            setErrorMessage("ゲスト利用の開始に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!token) {
            setErrorMessage("ログインが必要です。");
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/user`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                let serverMessage: string | null = null;

                try {
                    const errorData = (await response.json()) as {
                        message?: string;
                    };
                    serverMessage = errorData.message ?? null;
                } catch {
                    serverMessage = null;
                }

                throw new Error(
                    serverMessage ?? "アカウント削除に失敗しました。",
                );
            }

            await handleLogout();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "アカウント削除に失敗しました。",
            );
            setListMenuOpen(true);
            setScreen("list");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!token) {
            setUpdateEmailErrorMessage("ログインが必要です。");
            return;
        }

        const trimmedEmail = updateEmailValue.trim();

        if (!trimmedEmail) {
            setUpdateEmailErrorMessage("メールアドレスを入力してください。");
            setUpdateEmailSuccessMessage(null);
            return;
        }

        setUpdateEmailLoading(true);
        setUpdateEmailErrorMessage(null);
        setUpdateEmailSuccessMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/user/email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: trimmedEmail,
                }),
            });

            if (!response.ok) {
                throw new Error("メールアドレスの変更に失敗しました。");
            }

            setUpdateEmailSuccessMessage("メールアドレスを変更しました。");
            setUpdateEmailValue("");
            setListMenuOpen(false);
            setScreen("list");
        } catch (error) {
            setUpdateEmailErrorMessage(
                error instanceof Error
                    ? error.message
                    : "メールアドレスの変更に失敗しました。",
            );
        } finally {
            setUpdateEmailLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!token) {
            setUpdatePasswordErrorMessage("ログインが必要です。");
            return;
        }

        const currentPassword = currentPasswordValue.trim();
        const newPassword = newPasswordValue.trim();

        if (!currentPassword || !newPassword) {
            setUpdatePasswordErrorMessage(
                "現在のパスワードと新しいパスワードを入力してください。",
            );
            setUpdatePasswordSuccessMessage(null);
            return;
        }

        setUpdatePasswordLoading(true);
        setUpdatePasswordErrorMessage(null);
        setUpdatePasswordSuccessMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/user/password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            if (!response.ok) {
                let serverMessage: string | null = null;

                try {
                    const errorData = (await response.json()) as {
                        message?: string;
                    };
                    serverMessage = errorData.message ?? null;
                } catch {
                    serverMessage = null;
                }

                throw new Error(
                    serverMessage ?? "パスワードの変更に失敗しました。",
                );
            }

            setUpdatePasswordSuccessMessage("パスワードを変更しました。");
            setCurrentPasswordValue("");
            setNewPasswordValue("");
            setListMenuOpen(false);
            setScreen("list");
        } catch (error) {
            setUpdatePasswordErrorMessage(
                error instanceof Error
                    ? error.message
                    : "パスワードの変更に失敗しました。",
            );
        } finally {
            setUpdatePasswordLoading(false);
        }
    };

    useEffect(() => {
        if (!bootstrapping) {
            return;
        }

        const restoreAuth = async () => {
            try {
                const storedToken = await getAuthToken();
                const storedGuestId = await getGuestId();

                if (storedGuestId) {
                    setGuestId(storedGuestId);
                }

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
                setErrorMessage("ログインに失敗しました。");
            } finally {
                const elapsedTime = Date.now() - bootStartedAtRef.current;
                const remainingSplashTime = Math.max(
                    0,
                    MIN_BOOT_SPLASH_DURATION_MS - elapsedTime,
                );

                if (remainingSplashTime > 0) {
                    await new Promise((resolve) => {
                        setTimeout(resolve, remainingSplashTime);
                    });
                }

                setBootstrapping(false);
            }
        };

        void restoreAuth();
    }, [bootstrapping]);

    useEffect(() => {
        if (!authenticated) {
            return;
        }

        if (screen === "list" && words.length === 0) {
            void handleRefreshWords();
        }
    }, [authenticated, screen]);

    useEffect(() => {
        if (bootstrapping || attCheckCompleted) {
            return;
        }

        const ensureTrackingPermissionHandled = async () => {
            if (Platform.OS !== "ios") {
                setAttCheckCompleted(true);
                return;
            }

            try {
                const alreadyRequested = await getAttPermissionRequested();

                if (alreadyRequested === "true") {
                    setAttCheckCompleted(true);
                    return;
                }

                const currentPermission =
                    await getTrackingPermissionsAsync();

                console.log(
                    "ATT current permission status:",
                    currentPermission.status,
                );

                if (currentPermission.status === "undetermined") {
                    const requestedPermission =
                        await requestTrackingPermissionsAsync();

                    console.log(
                        "ATT requested permission status:",
                        requestedPermission.status,
                    );
                }

                await saveAttPermissionRequested();
            } catch (error) {
                console.log("ATT permission flow failed:", error);
            } finally {
                setAttCheckCompleted(true);
            }
        };

        void ensureTrackingPermissionHandled();
    }, [attCheckCompleted, bootstrapping]);

    if (bootstrapping) {
        return <BootSplashPage />;
    }

    if (screen === "signup") {
        return (
            <SignUpPage
                email={signUpEmail}
                password={signUpPassword}
                confirmPassword={signUpConfirmPassword}
                agreedToTerms={signUpAgreedToTerms}
                loading={loading}
                errorMessage={errorMessage}
                onChangeEmail={setSignUpEmail}
                onChangePassword={setSignUpPassword}
                onChangeConfirmPassword={setSignUpConfirmPassword}
                onToggleTerms={() =>
                    setSignUpAgreedToTerms((current) => !current)
                }
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
                errorMessage={errorMessage}
                onPressWord={handleSelectWord}
                onDeleteWord={handleDeleteWord}
                onOpenSearch={() => handleOpenSearch("list")}
                onOpenChangeEmail={handleOpenChangeEmail}
                onOpenChangePassword={handleOpenChangePassword}
                onDeleteAccount={handleDeleteAccount}
                menuOpen={listMenuOpen}
                onToggleMenu={() => setListMenuOpen((current) => !current)}
                onLogout={handleLogout}
            />
        );
    }

    if (screen === "detail" && selectedWord) {
        return (
            <WordDetailPage
                word={selectedWord}
                onBack={handleBackToList}
                onOpenSearch={() => handleOpenSearch("detail")}
            />
        );
    }

    if (screen === "search") {
        return (
            <SearchPage
                searchText={searchText}
                searchLoading={searchLoading}
                addToListLoading={addToListLoading}
                canAddToMyList={Boolean(token) || guestMode}
                guestUpgradePromptVisible={guestUpgradePromptVisible}
                guestUpgradePromptTitle={guestUpgradePromptTitle}
                guestUpgradePromptMessage={guestUpgradePromptMessage}
                searchBonusPromptVisible={searchBonusPromptVisible}
                searchBonusPromptLoading={searchBonusPromptLoading}
                searchBonusPromptTitle={searchBonusPromptTitle}
                searchBonusPromptMessage={searchBonusPromptMessage}
                searchBonusPromptErrorMessage={searchBonusPromptErrorMessage}
                searchErrorMessage={searchErrorMessage}
                searchResult={searchResult}
                onBack={handleBackFromSearch}
                onChangeSearchText={handleChangeSearchText}
                onSubmitSearch={handleDictionarySearch}
                onAddSearchResultToMyList={handleAddSearchResultToMyList}
                onCloseGuestUpgradePrompt={handleCloseGuestUpgradePrompt}
                onCloseSearchBonusPrompt={handleCloseSearchBonusPrompt}
                onNavigateSignUpFromGuestPrompt={
                    handleNavigateSignUpFromGuestPrompt
                }
                onWatchSearchBonusAd={handleWatchSearchBonusAd}
            />
        );
    }

    if (screen === "changeEmail") {
        return (
            <UpdateEmailPage
                email={updateEmailValue}
                loading={updateEmailLoading}
                errorMessage={updateEmailErrorMessage}
                successMessage={updateEmailSuccessMessage}
                onChangeEmail={(value) => {
                    setUpdateEmailValue(value);
                    if (updateEmailErrorMessage) {
                        setUpdateEmailErrorMessage(null);
                    }
                    if (updateEmailSuccessMessage) {
                        setUpdateEmailSuccessMessage(null);
                    }
                }}
                onSubmit={handleUpdateEmail}
                onBack={handleBackFromChangeEmail}
            />
        );
    }

    if (screen === "changePassword") {
        return (
            <UpdatePasswordPage
                currentPassword={currentPasswordValue}
                newPassword={newPasswordValue}
                loading={updatePasswordLoading}
                errorMessage={updatePasswordErrorMessage}
                successMessage={updatePasswordSuccessMessage}
                onChangeCurrentPassword={(value) => {
                    setCurrentPasswordValue(value);
                    if (updatePasswordErrorMessage) {
                        setUpdatePasswordErrorMessage(null);
                    }
                    if (updatePasswordSuccessMessage) {
                        setUpdatePasswordSuccessMessage(null);
                    }
                }}
                onChangeNewPassword={(value) => {
                    setNewPasswordValue(value);
                    if (updatePasswordErrorMessage) {
                        setUpdatePasswordErrorMessage(null);
                    }
                    if (updatePasswordSuccessMessage) {
                        setUpdatePasswordSuccessMessage(null);
                    }
                }}
                onSubmit={handleUpdatePassword}
                onBack={handleBackFromChangePassword}
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
            onUseGuest={handleUseGuest}
        />
    );
}
