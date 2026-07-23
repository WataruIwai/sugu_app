export type SubscriptionPurchaseState =
    | "idle"
    | "purchasing"
    | "verifying"
    | "success"
    | "cancelled"
    | "error"
    | "pending"
    | "restored"
    | "noPurchase";

export type SuguSubscriptionProduct = {
    id: string;
    name: string;
    price: string;
    rawProduct: Record<string, unknown>;
};

type PurchaseLog = {
    productId: string | null;
    transactionId: string | null;
    originalTransactionId: string | null;
    purchaseDate: string | null;
    expirationDate: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
    typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};

const firstText = (
    record: Record<string, unknown>,
    keys: string[],
): string | null => {
    for (const key of keys) {
        const value = record[key];

        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }

        if (typeof value === "number" && Number.isFinite(value)) {
            return String(value);
        }
    }

    return null;
};

const firstNestedText = (
    record: Record<string, unknown>,
    parentKey: string,
    keys: string[],
): string | null => firstText(asRecord(record[parentKey]), keys);

export const toSuguSubscriptionProduct = (
    product: unknown,
): SuguSubscriptionProduct | null => {
    const record = asRecord(product);
    const id = firstText(record, ["id", "productId", "productID"]);

    if (!id) {
        return null;
    }

    return {
        id,
        name:
            firstText(record, ["title", "displayName", "name"]) ??
            firstNestedText(record, "localized", ["title", "displayName"]) ??
            "Sugu Pro",
        price:
            firstText(record, [
                "displayPrice",
                "localizedPrice",
                "priceString",
                "subscriptionOfferDetails",
            ]) ?? "",
        rawProduct: record,
    };
};

export const normalizePurchaseLog = (purchase: unknown): PurchaseLog => {
    const record = asRecord(purchase);

    return {
        productId: firstText(record, ["productId", "productID", "id", "sku"]),
        transactionId: firstText(record, [
            "transactionId",
            "transactionID",
            "transactionIdentifier",
            "transactionIdentifierIOS",
            "id",
        ]),
        originalTransactionId: firstText(record, [
            "originalTransactionId",
            "originalTransactionID",
            "originalTransactionIdentifier",
            "originalTransactionIdentifierIOS",
            "originalTransactionIdIOS",
        ]),
        purchaseDate: firstText(record, [
            "purchaseDate",
            "transactionDate",
            "transactionDateIOS",
            "purchaseTime",
        ]),
        expirationDate: firstText(record, [
            "expirationDate",
            "expirationDateIOS",
            "subscriptionExpirationDate",
            "expiryDate",
        ]),
    };
};

export const logPurchaseDetails = (label: string, purchase: unknown) => {
    const normalized = normalizePurchaseLog(purchase);

    console.log(label, {
        productId: normalized.productId,
        transactionId: normalized.transactionId,
        originalTransactionId: normalized.originalTransactionId,
        purchaseDate: normalized.purchaseDate,
        expirationDate: normalized.expirationDate,
        rawPurchase: purchase,
    });
};

export const isPendingPurchase = (purchase: unknown) => {
    const record = asRecord(purchase);
    const status = firstText(record, [
        "purchaseState",
        "transactionState",
        "status",
        "state",
    ]);

    return status?.toLowerCase().includes("pending") ?? false;
};

export const isUserCancelledPurchaseError = (error: unknown) => {
    const record = asRecord(error);
    const code = firstText(record, ["code", "errorCode"]);
    const message =
        firstText(record, ["message", "debugMessage"]) ??
        (error instanceof Error ? error.message : null);
    const normalized = `${code ?? ""} ${message ?? ""}`.toLowerCase();

    return (
        normalized.includes("usercancel") ||
        normalized.includes("user_cancel") ||
        normalized.includes("cancel")
    );
};

export const getErrorMessage = (
    error: unknown,
    fallbackMessage: string,
): string =>
    error instanceof Error
        ? error.message
        : firstText(asRecord(error), ["message", "debugMessage"]) ??
          fallbackMessage;
