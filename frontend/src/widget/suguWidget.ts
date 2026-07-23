import { NativeModules, Platform } from "react-native";

import type { WordItem } from "../types";

const MAX_WIDGET_WORDS = 250;

type SuguWidgetBridge = {
    saveSnapshot: (snapshot: string) => Promise<void>;
    getSnapshot: () => Promise<string | null>;
    clearSnapshot: () => Promise<void>;
};

type WidgetSourceWord = WordItem & {
    meaningCount?: number;
};

const widgetBridge = NativeModules.SuguWidgetBridge as
    | SuguWidgetBridge
    | undefined;

const cleanText = (value?: string | null) => value?.trim() ?? "";

const toWidgetWord = (word: WidgetSourceWord) => {
    const primaryMeaningEn = cleanText(word.meaningEnglish) || cleanText(word.meaning);
    const primaryMeaningJa = cleanText(word.meaningJapanese);

    return {
        id: String(word.id),
        term: cleanText(word.word),
        primaryMeaningEn,
        primaryMeaningJa,
        exampleEn: word.memo ?? null,
        meaningCount: word.meaningCount ?? (primaryMeaningEn || primaryMeaningJa ? 1 : 0),
    };
};

export const syncSuguWidgetWords = async (words: WidgetSourceWord[]) => {
    if (Platform.OS !== "ios" || !widgetBridge) {
        console.log("Sugu widget sync skipped: native bridge unavailable");
        return;
    }

    const snapshot = {
        updatedAt: new Date().toISOString(),
        lastShownWordId: null,
        words: words.slice(0, MAX_WIDGET_WORDS).map(toWidgetWord),
    };

    try {
        await widgetBridge.saveSnapshot(JSON.stringify(snapshot));
        console.log("Sugu widget synced words:", snapshot.words.length);
    } catch (error) {
        console.log("Sugu widget sync failed:", error);
    }
};

export const getSuguWidgetSnapshot = async () => {
    if (Platform.OS !== "ios" || !widgetBridge) {
        return null;
    }

    try {
        return await widgetBridge.getSnapshot();
    } catch (error) {
        console.log("Sugu widget snapshot read failed:", error);
        return null;
    }
};

export const clearSuguWidgetWords = async () => {
    if (Platform.OS !== "ios" || !widgetBridge) {
        console.log("Sugu widget clear skipped: native bridge unavailable");
        return;
    }

    try {
        await widgetBridge.clearSnapshot();
        console.log("Sugu widget cleared");
    } catch (error) {
        console.log("Sugu widget clear failed:", error);
    }
};
