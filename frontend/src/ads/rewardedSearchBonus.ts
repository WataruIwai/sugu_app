import { Platform } from "react-native";

type GoogleMobileAdsModule = typeof import("react-native-google-mobile-ads");

export type RewardedSearchBonusAdResult =
    | { status: "earned" }
    | { status: "dismissed" }
    | { status: "unavailable"; message: string }
    | { status: "error"; message: string };

const getRewardedAdErrorMessage = (error: unknown): string => {
    const rawMessage =
        error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "";

    const normalizedMessage = rawMessage.toLowerCase();

    if (
        normalizedMessage.includes("account not approved yet") ||
        normalizedMessage.includes("no-fill")
    ) {
        return "広告配信準備中のため、もうしばらくお待ちください。";
    }

    return "広告の読み込みに失敗しました。時間をおいてお試しください。";
};

let cachedGoogleMobileAdsModule: GoogleMobileAdsModule | null | undefined;
let mobileAdsInitializationPromise: Promise<unknown> | null = null;

const getGoogleMobileAdsModule = (): GoogleMobileAdsModule | null => {
    if (cachedGoogleMobileAdsModule !== undefined) {
        return cachedGoogleMobileAdsModule;
    }

    try {
        cachedGoogleMobileAdsModule = require("react-native-google-mobile-ads") as GoogleMobileAdsModule;
    } catch (error) {
        console.log("Google Mobile Ads module is unavailable:", error);
        cachedGoogleMobileAdsModule = null;
    }

    return cachedGoogleMobileAdsModule;
};

const getRewardedAdUnitId = (
    googleMobileAdsModule: GoogleMobileAdsModule,
): string | null => {
    const configuredAdUnitId =
        Platform.OS === "ios"
            ? process.env.EXPO_PUBLIC_IOS_REWARDED_AD_UNIT_ID?.trim()
            : process.env.EXPO_PUBLIC_ANDROID_REWARDED_AD_UNIT_ID?.trim();

    if (configuredAdUnitId) {
        return configuredAdUnitId;
    }

    if (__DEV__) {
        return googleMobileAdsModule.TestIds.REWARDED;
    }

    return null;
};

const ensureMobileAdsInitialized = async (): Promise<boolean> => {
    const googleMobileAdsModule = getGoogleMobileAdsModule();

    if (!googleMobileAdsModule) {
        return false;
    }

    if (!mobileAdsInitializationPromise) {
        mobileAdsInitializationPromise = googleMobileAdsModule
            .MobileAds()
            .initialize()
            .catch((error) => {
                mobileAdsInitializationPromise = null;
                throw error;
            });
    }

    await mobileAdsInitializationPromise;
    return true;
};

export const canUseRewardedSearchBonusAd = (): boolean => {
    const googleMobileAdsModule = getGoogleMobileAdsModule();

    if (!googleMobileAdsModule) {
        return false;
    }

    return Boolean(getRewardedAdUnitId(googleMobileAdsModule));
};

export const showRewardedSearchBonusAd =
    async (): Promise<RewardedSearchBonusAdResult> => {
        const googleMobileAdsModule = getGoogleMobileAdsModule();

        if (!googleMobileAdsModule) {
            return {
                status: "unavailable",
                message:
                    "広告機能は開発用ビルドで利用できます。現在の環境では広告を表示できません。",
            };
        }

        const adUnitId = getRewardedAdUnitId(googleMobileAdsModule);

        if (!adUnitId) {
            return {
                status: "unavailable",
                message: "広告設定がまだ完了していません。",
            };
        }

        try {
            await ensureMobileAdsInitialized();
        } catch (error) {
            console.log("Google Mobile Ads initialization failed:", error);
            return {
                status: "error",
                message: "広告の初期化に失敗しました。もう一度お試しください。",
            };
        }

        return new Promise((resolve) => {
            const rewardedAd = googleMobileAdsModule.RewardedAd.createForAdRequest(
                adUnitId,
                {
                    requestNonPersonalizedAdsOnly: true,
                },
            );
            let rewardEarned = false;

            const cleanup = (unsubscribeCallbacks: Array<() => void>) => {
                unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
            };

            const unsubscribeCallbacks = [
                rewardedAd.addAdEventListener(
                    googleMobileAdsModule.RewardedAdEventType.LOADED,
                    () => {
                        void rewardedAd.show().catch((error) => {
                            console.log("Rewarded ad show failed:", error);
                            cleanup(unsubscribeCallbacks);
                            resolve({
                                status: "error",
                                message:
                                    "広告の表示に失敗しました。もう一度お試しください。",
                            });
                        });
                    },
                ),
                rewardedAd.addAdEventListener(
                    googleMobileAdsModule.RewardedAdEventType.EARNED_REWARD,
                    () => {
                        rewardEarned = true;
                    },
                ),
                rewardedAd.addAdEventListener(
                    googleMobileAdsModule.AdEventType.ERROR,
                    (error) => {
                        console.log("Rewarded ad load failed:", error);
                        cleanup(unsubscribeCallbacks);
                        resolve({
                            status: "error",
                            message: getRewardedAdErrorMessage(error),
                        });
                    },
                ),
                rewardedAd.addAdEventListener(
                    googleMobileAdsModule.AdEventType.CLOSED,
                    () => {
                        cleanup(unsubscribeCallbacks);
                        resolve({
                            status: rewardEarned ? "earned" : "dismissed",
                        });
                    },
                ),
            ];

            rewardedAd.load();
        });
    };
