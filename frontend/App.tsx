import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
    getTrackingPermissionsAsync,
    requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";

import {
    getChromeExtensionNoticeDismissed,
    getAttPermissionRequested,
    deleteAuthToken,
    getGuestId,
    getAuthToken,
    getOnboardingCompleted,
    saveChromeExtensionNoticeDismissed,
    saveAttPermissionRequested,
    saveGuestId,
    saveAuthToken,
    saveOnboardingCompleted,
} from "./src/auth/tokenStorage";
import {
    canUseRewardedSearchBonusAd,
    showRewardedSearchBonusAd,
} from "./src/ads/rewardedSearchBonus";
import { SignInPage } from "./src/pages/SignInPage";
import { VocabularyListPage } from "./src/pages/VocabularyListPage";
import type { NoticeItem } from "./src/pages/VocabularyListPage";
import { WordDetailPage } from "./src/pages/WordDetailPage";
import { SearchPage } from "./src/pages/SearchPage";
import { SuguProPage } from "./src/pages/SuguProPage";
import { BootSplashPage } from "./src/pages/BootSplashPage";
import { OnboardingPage } from "./src/pages/OnboardingPage";
import { useSubscription } from "./src/subscription/useSubscription";
import { API_BASE_URL } from "./src/config/api";
import type { SearchResult, WordDetailItem, WordItem } from "./src/types";
import {
    clearSuguWidgetWords,
    syncSuguWidgetWords,
} from "./src/widget/suguWidget";

const TERMS_URL =
    "https://www.notion.so/3559a7163b3880239ec3ed3cfed7bbff?source=copy_link";
const PRIVACY_POLICY_URL =
    "https://www.notion.so/3559a7163b3880e4a470c45ee1e4e9cd?source=copy_link";
const SUPPORT_URL =
    "https://www.notion.so/Sugu-3599a7163b388045939ef45464732cff?source=copy_link";
const CHROME_EXTENSION_LP_URL = "https://example.com/sugu-chrome-extension";
const APP_NOTICES: NoticeItem[] = [
    {
        id: "chrome-extension-release",
        title: "Chrome拡張をリリースしました。",
        url: CHROME_EXTENSION_LP_URL,
    },
];

type Screen =
    | "onboarding"
    | "signin"
    | "list"
    | "detail"
    | "search"
    | "pro";
type SearchReturnScreen = "signin" | "list" | "detail";
type ProReturnScreen = "signin" | "list" | "search";

const normalizeToken = (raw: string) => raw.trim().replace(/^"|"$/g, "");
const MIN_BOOT_SPLASH_DURATION_MS = 2000;
const FORCE_SHOW_ONBOARDING = false;
type SuguDeepLink =
    | { type: "word"; wordId: number }
    | { type: "search"; word?: string };

const getQueryValue = (query: string | undefined, key: string) => {
    if (!query) {
        return undefined;
    }

    const pair = query
        .split("&")
        .map((part) => part.split("="))
        .find(([name]) => decodeURIComponent(name) === key);

    return pair?.[1]
        ? decodeURIComponent(pair[1].replace(/\+/g, " "))
        : undefined;
};

const parseSuguDeepLink = (url: string): SuguDeepLink | null => {
    if (!url.startsWith("sugu://")) {
        return null;
    }

    const [baseUrl, query] = url.split("?");
    const path = baseUrl.replace("sugu://", "");

    if (path.startsWith("word/")) {
        const wordId = Number(path.replace("word/", ""));
        return Number.isFinite(wordId) ? { type: "word", wordId } : null;
    }

    if (path === "search") {
        return { type: "search", word: getQueryValue(query, "word") };
    }

    return null;
};

const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
    BAD_REQUEST: "入力内容に誤りがあります",
    UNAUTHORIZED: "認証に失敗しました",
    NOT_FOUND: "データが見つかりませんでした",
    CONFLICT: "既に登録されています",
    TOO_MANY_REQUESTS: "本日の検索回数の上限に達しました",
    INTERNAL_SERVER_ERROR: "サーバーエラーが発生しました",
    INTERNAL_ERROR: "サーバーエラーが発生しました",
};

const resolveServerErrorMessage = (
    serverMessage: string | null | undefined,
    fallbackMessage: string,
) => {
    if (!serverMessage) {
        return fallbackMessage;
    }

    return ERROR_MESSAGE_BY_CODE[serverMessage] ?? serverMessage;
};

const parseServerErrorMessage = (
    rawResponseText: string,
    fallbackMessage: string,
) => {
    try {
        const errorData = JSON.parse(rawResponseText) as {
            message?: string;
        };

        return resolveServerErrorMessage(errorData.message, fallbackMessage);
    } catch {
        return fallbackMessage;
    }
};

const generateNonce = (byteLength = 32) =>
    Array.from(Crypto.getRandomBytes(byteLength))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

export default function App() {
    const subscription = useSubscription();
    const bootStartedAtRef = useRef(Date.now());
    const handledInitialUrlRef = useRef<string | null>(null);
    const [screen, setScreen] = useState<Screen>("signin");
    const [token, setToken] = useState<string | null>(null);
    const [guestId, setGuestId] = useState<string | null>(null);
    const [bootstrapping, setBootstrapping] = useState(true);

    const [signInAgreedToTerms, setSignInAgreedToTerms] = useState(false);

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
    const [proReturnScreen, setProReturnScreen] =
        useState<ProReturnScreen>("list");

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
    const [chromeExtensionNoticeVisible, setChromeExtensionNoticeVisible] =
        useState(false);

    const authenticated = useMemo(() => Boolean(token), [token]);
    const guestMode = useMemo(
        () => !token && Boolean(guestId),
        [guestId, token],
    );

    const buildGuestId = () =>
        `guest_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

    const handleCloseChromeExtensionNotice = () => {
        setChromeExtensionNoticeVisible(false);
    };

    const handleDismissChromeExtensionNoticePermanently = async () => {
        setChromeExtensionNoticeVisible(false);
        await saveChromeExtensionNoticeDismissed();
    };

    const buildSuguWidgetWord = async (
        word: WordItem,
        currentToken: string,
    ) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/words/${word.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${currentToken}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const detail = (await response.json()) as WordDetailItem;
            const primaryEntry = detail.entries[0];

            return {
                ...word,
                word: detail.word || word.word,
                meaningEnglish: primaryEntry?.meaning_en ?? "",
                meaningJapanese: primaryEntry?.meaning_ja ?? "",
                memo: primaryEntry?.example ?? word.memo,
                meaningCount: detail.entries.length,
            };
        } catch (error) {
            console.log("Sugu widget detail sync fallback:", error);
            return word;
        }
    };

    const fetchWords = async (currentToken: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/words`, {
            headers: {
                Authorization: `Bearer ${currentToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(
                parseServerErrorMessage(
                    await response.text(),
                    "単語一覧の取得に失敗しました。",
                ),
            );
        }

        const data = (await response.json()) as WordItem[];
        setWords(data);

        if (Platform.OS === "ios" && data.length === 0) {
            await syncSuguWidgetWords([]);
        }

        return data;
    };

    const fetchWordDetail = async (wordId: number, currentToken: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/words/${wordId}`, {
            headers: {
                Authorization: `Bearer ${currentToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(
                parseServerErrorMessage(
                    await response.text(),
                    "単語詳細の取得に失敗しました。",
                ),
            );
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
        setScreen("signin");
    };

    const handleContinueWithApple = async (agreedToTerms: boolean) => {
        setLoading(true);
        setErrorMessage(null);

        try {
            if (!agreedToTerms) {
                throw new Error("利用規約への同意が必要です。");
            }

            if (Platform.OS !== "ios") {
                throw new Error("Sign in with Apple は iOS でのみ利用できます。");
            }

            const appleAuthAvailable =
                await AppleAuthentication.isAvailableAsync();

            if (!appleAuthAvailable) {
                throw new Error(
                    "この端末では Sign in with Apple を利用できません。",
                );
            }

            const rawNonce = generateNonce();
            const expectedNonceHash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                rawNonce,
            );

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                ],
                nonce: expectedNonceHash,
            });

            if (!credential.identityToken) {
                throw new Error(
                    "Apple ID 認証トークンを取得できませんでした。",
                );
            }

            const response = await fetch(`${API_BASE_URL}/api/v1/auth/apple`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    identityToken: credential.identityToken,
                    expectedNonceHash,
                    agreedToTerms,
                }),
            });

            if (!response.ok) {
                const rawResponseText = await response.text();
                throw new Error(
                    parseServerErrorMessage(
                        rawResponseText,
                        "Apple ログインに失敗しました。",
                    ),
                );
            }

            const currentToken = normalizeToken(await response.text());
            await saveAuthToken(currentToken);
            setToken(currentToken);
            setScreen("list");
            await fetchWords(currentToken);
        } catch (error) {
            console.log("Apple sign in error:", error);
            console.log(
                "Apple sign in error code:",
                typeof error === "object" &&
                    error !== null &&
                    "code" in error
                    ? error.code
                    : null,
            );
            console.log(
                "Apple sign in error message:",
                error instanceof Error ? error.message : null,
            );

            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "ERR_REQUEST_CANCELED"
            ) {
                setErrorMessage(null);
                return;
            }

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Apple ログインに失敗しました。",
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

    const handleSuguDeepLink = useCallback(
        async (url: string) => {
            const deepLink = parseSuguDeepLink(url);

            if (!deepLink) {
                return;
            }

            setGuestUpgradePromptVisible(false);
            setSearchBonusPromptVisible(false);
            setSearchBonusPromptErrorMessage(null);
            setErrorMessage(null);

            if (deepLink.type === "search") {
                setSearchText(deepLink.word ?? "");
                setSearchResult(null);
                setSearchErrorMessage(null);
                setSearchReturnScreen(token ? "list" : "signin");
                setScreen(token || guestId ? "search" : "signin");
                return;
            }

            if (!token) {
                setScreen("signin");
                return;
            }

            setLoading(true);

            try {
                await fetchWordDetail(deepLink.wordId, token);
            } catch (error) {
                setSelectedWord(null);
                setScreen("list");
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "単語詳細の取得に失敗しました。",
                );
            } finally {
                setLoading(false);
            }
        },
        [guestId, token],
    );

    const handleDeleteWord = async (wordId: number) => {
        if (!token) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/words/${wordId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(
                    parseServerErrorMessage(
                        await response.text(),
                        "単語の削除に失敗しました。",
                    ),
                );
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

    const handleAddWordToWidget = async (word: WordItem) => {
        if (!token) {
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            await syncSuguWidgetWords([
                await buildSuguWidgetWord(word, token),
            ]);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Widgetへの追加に失敗しました。",
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

    const handleOpenPro = (from: ProReturnScreen) => {
        setProReturnScreen(from);
        setListMenuOpen(false);
        setGuestUpgradePromptVisible(false);
        setSearchBonusPromptVisible(false);
        setSearchBonusPromptErrorMessage(null);
        if (token) {
            void subscription.refreshStatus();
        }
        setScreen("pro");
    };

    const handleBackFromPro = () => {
        if (token) {
            void subscription.refreshStatus();
        }
        setScreen(proReturnScreen);
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
                `${API_BASE_URL}/api/v1/dictionary/search`,
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

            if (!response.ok) {
                const serverMessage = parseServerErrorMessage(
                    rawResponseText,
                    "検索に失敗しました。",
                );

                const isSearchLimitError =
                    response.status === 429 ||
                    serverMessage?.includes("上限") ||
                    serverMessage?.includes("search limit") ||
                    serverMessage?.includes("Too many requests");

                if (isSearchLimitError) {
                    setSearchErrorMessage(null);
                    if (!token) {
                        openGuestUpgradePrompt(
                            serverMessage,
                            "無料のアカウントを作成すると、登録ユーザー向けの検索回数を利用できます。",
                        );
                        return;
                    }

                    openSearchBonusPrompt(
                        serverMessage,
                        canUseRewardedSearchBonusAd()
                            ? "広告を視聴すると、追加で3回検索できます。"
                            : "広告機能の準備ができていません。開発用ビルドで確認してください。",
                    );
                    return;
                }

                throw new Error(serverMessage);
            }

            const data = JSON.parse(rawResponseText) as SearchResult;
            setSearchBonusPromptVisible(false);
            setSearchBonusPromptErrorMessage(null);
            setSearchResult(data);
        } catch (error) {
            setSearchErrorMessage(
                error instanceof Error ? error.message : "検索に失敗しました。",
            );
            setSearchResult(null);
        } finally {
            if (token) {
                void subscription.refreshStatus();
            }
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
            const response = await fetch(`${API_BASE_URL}/api/v1/words`, {
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
                throw new Error(
                    parseServerErrorMessage(
                        await response.text(),
                        "My List への追加に失敗しました。",
                    ),
                );
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
        if (!token) {
            throw new Error("ログインが必要です。");
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/usage/bonus`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(
                parseServerErrorMessage(
                    await response.text(),
                    "広告視聴後の特典反映に失敗しました。もう一度お試しください。",
                ),
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
        await clearSuguWidgetWords();
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

    const handleOpenTerms = async () => {
        try {
            await Linking.openURL(TERMS_URL);
        } catch {
            setErrorMessage("利用規約ページを開けませんでした。");
        }
    };

    const handleOpenPrivacyPolicy = async () => {
        try {
            await Linking.openURL(PRIVACY_POLICY_URL);
        } catch {
            setErrorMessage("プライバシーポリシーページを開けませんでした。");
        }
    };

    const handleOpenSupport = async () => {
        try {
            await Linking.openURL(SUPPORT_URL);
        } catch {
            setErrorMessage("お問い合わせページを開けませんでした。");
        }
    };

    const handleOpenNotice = async (notice: NoticeItem) => {
        try {
            setListMenuOpen(false);
            await Linking.openURL(notice.url);
        } catch {
            setErrorMessage("お知らせページを開けませんでした。");
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
            const response = await fetch(`${API_BASE_URL}/api/v1/user`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(
                    parseServerErrorMessage(
                        await response.text(),
                        "アカウント削除に失敗しました。",
                    ),
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

    const handleCompleteOnboarding = async () => {
        await saveOnboardingCompleted();
        setScreen("signin");
    };

    useEffect(() => {
        if (!bootstrapping) {
            return;
        }

        const restoreAuth = async () => {
            try {
                const storedToken = await getAuthToken();
                const storedGuestId = await getGuestId();
                const onboardingCompleted = await getOnboardingCompleted();
                const chromeExtensionNoticeDismissed =
                    await getChromeExtensionNoticeDismissed();

                setChromeExtensionNoticeVisible(
                    chromeExtensionNoticeDismissed !== "true",
                );

                if (storedGuestId) {
                    setGuestId(storedGuestId);
                }

                if (FORCE_SHOW_ONBOARDING) {
                    setScreen("onboarding");
                    return;
                }

                if (!storedToken) {
                    setScreen(
                        onboardingCompleted === "true"
                            ? "signin"
                            : "onboarding",
                    );
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
        if (bootstrapping) {
            return;
        }

        const handleInitialUrl = async () => {
            const initialUrl = await Linking.getInitialURL();

            if (!initialUrl || handledInitialUrlRef.current === initialUrl) {
                return;
            }

            handledInitialUrlRef.current = initialUrl;
            await handleSuguDeepLink(initialUrl);
        };

        void handleInitialUrl();

        const subscription = Linking.addEventListener("url", ({ url }) => {
            void handleSuguDeepLink(url);
        });

        return () => {
            subscription.remove();
        };
    }, [bootstrapping, handleSuguDeepLink]);

    useEffect(() => {
        if (!authenticated) {
            return;
        }

        if (screen === "list" && words.length === 0) {
            void handleRefreshWords();
        }
    }, [authenticated, screen]);

    useEffect(() => {
        if (!token) {
            return;
        }

        void subscription.refreshStatus();

        const subscriptionStatusListener = AppState.addEventListener(
            "change",
            (state) => {
                if (state === "active") {
                    void subscription.refreshStatus();
                }
            },
        );

        return () => subscriptionStatusListener.remove();
    }, [subscription.refreshStatus, token]);

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

    if (screen === "list") {
        return (
            <VocabularyListPage
                words={words}
                errorMessage={errorMessage}
                notices={APP_NOTICES}
                onPressWord={handleSelectWord}
                onDeleteWord={handleDeleteWord}
                onAddWordToWidget={handleAddWordToWidget}
                onOpenSearch={() => handleOpenSearch("list")}
                onOpenTerms={handleOpenTerms}
                onOpenPrivacyPolicy={handleOpenPrivacyPolicy}
                onOpenSupport={handleOpenSupport}
                onOpenPro={() => handleOpenPro("list")}
                onDeleteAccount={handleDeleteAccount}
                isPro={Boolean(token) && subscription.isActive}
                menuOpen={listMenuOpen}
                onToggleMenu={() => setListMenuOpen((current) => !current)}
                onLogout={handleLogout}
                onOpenNotice={handleOpenNotice}
                chromeExtensionNoticeVisible={
                    Boolean(token) && chromeExtensionNoticeVisible
                }
                onCloseChromeExtensionNotice={
                    handleCloseChromeExtensionNotice
                }
                onDismissChromeExtensionNoticePermanently={
                    handleDismissChromeExtensionNoticePermanently
                }
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
                onOpenPro={() => handleOpenPro("search")}
                chromeExtensionNoticeVisible={
                    guestMode && chromeExtensionNoticeVisible
                }
                onCloseChromeExtensionNotice={
                    handleCloseChromeExtensionNotice
                }
                onDismissChromeExtensionNoticePermanently={
                    handleDismissChromeExtensionNoticePermanently
                }
            />
        );
    }

    if (screen === "pro") {
        return (
            <SuguProPage
                onBack={handleBackFromPro}
                onPurchase={subscription.purchase}
                onRestore={subscription.restore}
                productPrice={subscription.productPrice}
                isLoadingProduct={subscription.isLoadingProduct}
                isPurchasing={subscription.isPurchasing}
                isRestoring={subscription.isRestoring}
                isActive={subscription.isActive}
                errorMessage={subscription.error}
                purchaseState={subscription.purchaseState}
            />
        );
    }

    if (screen === "onboarding") {
        return <OnboardingPage onComplete={() => void handleCompleteOnboarding()} />;
    }

    return (
        <SignInPage
            agreedToTerms={signInAgreedToTerms}
            loading={loading}
            errorMessage={errorMessage}
            onToggleTerms={() =>
                setSignInAgreedToTerms((current) => !current)
            }
            onSubmitApple={() =>
                void handleContinueWithApple(signInAgreedToTerms)
            }
            onOpenTerms={handleOpenTerms}
            onOpenPrivacyPolicy={handleOpenPrivacyPolicy}
            onUseGuest={handleUseGuest}
        />
    );
}
