export type WordItem = {
    id: number;
    userId: number;
    word: string;
    meaning?: string;
    meaningEnglish?: string;
    meaningJapanese?: string;
    memo?: string;
    pronunciation?: string;
};

export type SearchEntry = {
    meaning_en: string;
    meaning_ja: string;
    example: string;
};

export type SearchResult = {
    word: string;
    candidates?: string[];
    entries?: SearchEntry[];
    status: string;
};

export type WordDetailItem = {
    word: string;
    entries: SearchEntry[];
};
