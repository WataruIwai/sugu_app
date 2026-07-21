import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import {
    fetchProducts as fetchProductsFromStore,
    finishTransaction,
    getAvailablePurchases as getAvailablePurchasesFromStore,
    useIAP,
} from "expo-iap";

import { getAuthToken } from "../auth/tokenStorage";
import { API_BASE_URL } from "../config/api";
import { SUGU_PRO_MONTHLY_PRODUCT_ID } from "./subscriptionConstants";
import {
    getErrorMessage,
    isPendingPurchase,
    isUserCancelledPurchaseError,
    logPurchaseDetails,
    normalizePurchaseLog,
    type SuguSubscriptionProduct,
    type SubscriptionPurchaseState,
    toSuguSubscriptionProduct,
} from "./subscriptionService";

const PRODUCT_LOAD_ERROR_MESSAGE =
    "Sugu Proの商品情報を取得できませんでした。時間をおいて再度お試しください。";
const PURCHASE_ERROR_MESSAGE =
    "購入処理を開始できませんでした。時間をおいて再度お試しください。";
const RESTORE_ERROR_MESSAGE =
    "購入の復元に失敗しました。時間をおいて再度お試しください。";

type AppAccountTokenResponse = {
    appAccountToken?: string;
};

type SubscriptionStatusResponse = {
    status?: string;
};

const matchesSuguProProduct = (purchase: unknown) => {
    if (typeof purchase !== "object" || purchase === null) {
        return false;
    }

    const record = purchase as Record<string, unknown>;
    const productId =
        record.productId ?? record.productID ?? record.id ?? record.sku;

    return productId === SUGU_PRO_MONTHLY_PRODUCT_ID;
};

const fetchAppAccountToken = async () => {
    const token = await getAuthToken();

    if (!token) {
        throw new Error("ログイン情報を確認できませんでした。再度ログインしてください。");
    }

    const response = await fetch(
        `${API_BASE_URL}/api/v1/subscription/appAccountToken`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    if (!response.ok) {
        throw new Error("購入に必要なユーザー情報を取得できませんでした。");
    }

    const data = (await response.json()) as AppAccountTokenResponse;

    if (!data.appAccountToken) {
        throw new Error("購入に必要なユーザー情報を取得できませんでした。");
    }

    return data.appAccountToken;
};

const verifySubscriptionPurchase = async (purchase: unknown) => {
    const token = await getAuthToken();

    if (!token) {
        throw new Error("ログイン情報を確認できませんでした。再度ログインしてください。");
    }

    const transactionId = normalizePurchaseLog(purchase).transactionId;

    if (!transactionId) {
        throw new Error("購入トランザクションIDを取得できませんでした。");
    }

    const response = await fetch(
        `${API_BASE_URL}/api/v1/subscription/verify?transactionId=${encodeURIComponent(
            transactionId,
        )}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    if (!response.ok) {
        throw new Error("購入情報の確認に失敗しました。");
    }
};

const fetchSubscriptionStatus = async () => {
    const token = await getAuthToken();

    if (!token) {
        return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/subscription/status`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("サブスクリプション状態の確認に失敗しました。");
    }

    const data = (await response.json()) as SubscriptionStatusResponse;
    return data.status === "ACTIVE";
};

export const useSubscription = () => {
    const productLoadRequestedRef = useRef(false);
    const [product, setProduct] = useState<SuguSubscriptionProduct | null>(
        null,
    );
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [purchaseState, setPurchaseState] =
        useState<SubscriptionPurchaseState>("idle");
    const [isActive, setIsActive] = useState(false);

    const {
        connected,
        subscriptions,
        requestPurchase,
        restorePurchases,
        reconnect,
    } = useIAP({
        onPurchaseSuccess: async (purchase) => {
            logPurchaseDetails("Sugu Pro purchase success:", purchase);
            setError(null);
            setPurchaseState(
                isPendingPurchase(purchase) ? "pending" : "success",
            );

            try {
                await verifySubscriptionPurchase(purchase);
                setIsActive(true);
                console.log("Sugu Pro purchase verified");

                await finishTransaction({
                    purchase,
                    isConsumable: false,
                });
                console.log("Sugu Pro transaction finished");
            } catch (purchaseVerificationError) {
                console.log(
                    "Sugu Pro purchase verification error:",
                    purchaseVerificationError,
                );
                setPurchaseState("error");
                setError(
                    getErrorMessage(
                        purchaseVerificationError,
                        "購入情報の確認に失敗しました。",
                    ),
                );
            } finally {
                setIsPurchasing(false);
            }
        },
        onPurchaseError: (purchaseError) => {
            console.log("Sugu Pro purchase error:", purchaseError);
            setIsPurchasing(false);

            if (isUserCancelledPurchaseError(purchaseError)) {
                setPurchaseState("cancelled");
                setError(null);
                return;
            }

            setPurchaseState("error");
            setError(getErrorMessage(purchaseError, PURCHASE_ERROR_MESSAGE));
        },
        onError: (iapError) => {
            console.log("Sugu Pro IAP error:", iapError);
        },
    });

    const normalizedProduct = useMemo(() => {
        const candidate = subscriptions.find(
            (subscription) => subscription.id === SUGU_PRO_MONTHLY_PRODUCT_ID,
        );

        return toSuguSubscriptionProduct(candidate);
    }, [subscriptions]);

    useEffect(() => {
        if (normalizedProduct) {
            setProduct(normalizedProduct);
        }
    }, [normalizedProduct]);

    const loadProduct = useCallback(async () => {
        if (Platform.OS !== "ios") {
            setError("Sugu Proは現在iOSでのみ確認できます。");
            return;
        }

        if (isLoadingProduct || product || productLoadRequestedRef.current) {
            return;
        }

        productLoadRequestedRef.current = true;
        setIsLoadingProduct(true);
        setError(null);

        try {
            if (!connected) {
                const reconnected = await reconnect();

                if (!reconnected) {
                    throw new Error("StoreKitに接続できていません。");
                }
            }

            const fetchedProducts = await fetchProductsFromStore({
                skus: [SUGU_PRO_MONTHLY_PRODUCT_ID],
                type: "subs",
            });
            console.log("Sugu Pro fetched subscriptions:", fetchedProducts);

            const fetchedProduct = Array.isArray(fetchedProducts)
                ? fetchedProducts
                      .map(toSuguSubscriptionProduct)
                      .find(
                          (subscriptionProduct) =>
                              subscriptionProduct?.id ===
                              SUGU_PRO_MONTHLY_PRODUCT_ID,
                      )
                : null;

            if (fetchedProduct) {
                setProduct(fetchedProduct);
                return;
            }

            throw new Error(
                `StoreKitで商品が見つかりませんでした: ${SUGU_PRO_MONTHLY_PRODUCT_ID}`,
            );
        } catch (loadError) {
            console.log("Sugu Pro product load error:", loadError);
            setError(getErrorMessage(loadError, PRODUCT_LOAD_ERROR_MESSAGE));
        } finally {
            setIsLoadingProduct(false);
        }
    }, [connected, isLoadingProduct, product, reconnect]);

    useEffect(() => {
        void loadProduct();
    }, [loadProduct]);

    const refreshStatus = useCallback(async () => {
        try {
            setIsActive(await fetchSubscriptionStatus());
        } catch (statusError) {
            console.log("Sugu Pro status refresh error:", statusError);
            setIsActive(false);
        }
    }, []);

    const purchase = useCallback(async () => {
        if (isPurchasing || isRestoring) {
            return;
        }

        if (Platform.OS !== "ios") {
            setError("Sugu Proは現在iOSでのみ確認できます。");
            return;
        }

        if (!connected && !(await reconnect())) {
            setError("StoreKitに接続できていません。");
            return;
        }

        if (!product) {
            setError("商品情報を取得できていません。");
            return;
        }

        setIsPurchasing(true);
        setPurchaseState("purchasing");
        setError(null);

        try {
            const appAccountToken = await fetchAppAccountToken();

            await requestPurchase({
                request: {
                    apple: {
                        sku: SUGU_PRO_MONTHLY_PRODUCT_ID,
                        appAccountToken,
                    },
                    google: {
                        skus: [SUGU_PRO_MONTHLY_PRODUCT_ID],
                    },
                },
                type: "subs",
            });
        } catch (purchaseError) {
            console.log("Sugu Pro purchase request error:", purchaseError);
            setIsPurchasing(false);

            if (isUserCancelledPurchaseError(purchaseError)) {
                setPurchaseState("cancelled");
                return;
            }

            setPurchaseState("error");
            setError(getErrorMessage(purchaseError, PURCHASE_ERROR_MESSAGE));
        }
    }, [
        connected,
        isPurchasing,
        isRestoring,
        product,
        reconnect,
        requestPurchase,
    ]);

    const restore = useCallback(async () => {
        if (isPurchasing || isRestoring) {
            return;
        }

        if (Platform.OS !== "ios") {
            setError("Sugu Proは現在iOSでのみ確認できます。");
            return;
        }

        if (!connected && !(await reconnect())) {
            setError("StoreKitに接続できていません。");
            return;
        }

        setIsRestoring(true);
        setError(null);

        try {
            await restorePurchases();
            const availablePurchases = await getAvailablePurchasesFromStore();

            const restoredPurchases = Array.isArray(availablePurchases)
                ? availablePurchases.filter(matchesSuguProProduct)
                : [];

            if (restoredPurchases.length === 0) {
                console.log("Sugu Pro restore: no purchases found");
                setPurchaseState("noPurchase");
                setIsActive(false);
                return;
            }

            for (const restoredPurchase of restoredPurchases) {
                logPurchaseDetails(
                    "Sugu Pro restored purchase:",
                    restoredPurchase,
                );
                await verifySubscriptionPurchase(restoredPurchase);
            }
            setIsActive(true);
            setPurchaseState("restored");
        } catch (restoreError) {
            console.log("Sugu Pro restore error:", restoreError);
            setPurchaseState("error");
            setError(getErrorMessage(restoreError, RESTORE_ERROR_MESSAGE));
        } finally {
            setIsRestoring(false);
        }
    }, [
        connected,
        isPurchasing,
        isRestoring,
        reconnect,
        restorePurchases,
    ]);

    return {
        product,
        productName: product?.name ?? null,
        productPrice: product?.price ?? null,
        isLoadingProduct,
        isPurchasing,
        isRestoring,
        error,
        purchaseState,
        isActive,
        loadProduct,
        refreshStatus,
        purchase,
        restore,
    };
};
