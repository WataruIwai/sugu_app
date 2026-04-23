import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components/native";
import {
    Animated,
    Easing,
    Keyboard,
    Platform,
    Pressable,
    ScrollView,
    TextInput as RNTextInput,
    useWindowDimensions,
} from "react-native";

import { SearchResult } from "../types";

const SHEET_TOP_INSET = 78;

type SearchBottomSheetProps = {
    disabled?: boolean;
    searchText: string;
    searchLoading: boolean;
    addToListLoading?: boolean;
    searchErrorMessage: string | null;
    searchResult: SearchResult | null;
    onChangeSearchText: (value: string) => void;
    onSubmitSearch: () => void;
    onAddToMyList?: () => Promise<boolean>;
    onOpenChange?: (open: boolean) => void;
};

export const SearchBottomSheet = ({
    disabled = false,
    searchText,
    searchLoading,
    addToListLoading = false,
    searchErrorMessage,
    searchResult,
    onChangeSearchText,
    onSubmitSearch,
    onAddToMyList,
    onOpenChange,
}: SearchBottomSheetProps) => {
    const { height } = useWindowDimensions();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    const keyboardOffset = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<RNTextInput | null>(null);
    const clearRequestedRef = useRef(false);
    const hasSearchText = searchText.trim().length > 0;
    const canAddToMyList =
        searchResult?.status === "SUCCESS" &&
        Boolean(searchResult.word) &&
        Boolean(searchResult.entries && searchResult.entries.length > 0);

    useEffect(() => {
        onOpenChange?.(isSheetOpen);
    }, [isSheetOpen, onOpenChange]);

    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const handleKeyboardShow = (event: {
            duration?: number;
            endCoordinates: { height: number };
        }) => {
            Animated.timing(keyboardOffset, {
                toValue: event.endCoordinates.height + 8,
                duration: event.duration ?? 250,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        };

        const handleKeyboardHide = (event?: { duration?: number }) => {
            Animated.timing(keyboardOffset, {
                toValue: 0,
                duration: event?.duration ?? 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        };

        const showSubscription = Keyboard.addListener(
            showEvent,
            handleKeyboardShow,
        );
        const hideSubscription = Keyboard.addListener(
            hideEvent,
            handleKeyboardHide,
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [keyboardOffset]);

    const sheetTranslateY = useMemo(
        () =>
            progress.interpolate({
                inputRange: [0, 1],
                outputRange: [height, 0],
            }),
        [height, progress],
    );

    const overlayOpacity = useMemo(
        () =>
            progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
            }),
        [progress],
    );

    const openSheet = () => {
        setIsSheetOpen(true);
        Animated.timing(progress, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    const closeSheet = () => {
        Animated.timing(progress, {
            toValue: 0,
            duration: 240,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                setIsSheetOpen(false);
            }
        });
    };

    const runSubmitSearch = () => {
        onSubmitSearch();
    };

    const handleClearText = () => {
        clearRequestedRef.current = true;
        onChangeSearchText("");
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const handleInputBlur = () => {
        if (!clearRequestedRef.current) {
            return;
        }

        clearRequestedRef.current = false;
        onChangeSearchText("");
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const handleAddToMyList = async () => {
        if (!onAddToMyList) {
            return;
        }

        const added = await onAddToMyList();
        if (added) {
            Keyboard.dismiss();
            closeSheet();
        }
    };

    return (
        <>
            <AnimatedSearchTriggerBarWrap
                style={{
                    bottom: Animated.add(
                        keyboardOffset,
                        new Animated.Value(-20),
                    ),
                }}
            >
                <SearchTriggerTrack>
                    <SearchTriggerInput
                        ref={inputRef}
                        editable={!searchLoading && !disabled}
                        placeholder="検索したい単語を入力"
                        placeholderTextColor="#8f8f8f"
                        returnKeyType="search"
                        value={searchText}
                        onChangeText={onChangeSearchText}
                        onFocus={openSheet}
                        onBlur={handleInputBlur}
                        onSubmitEditing={runSubmitSearch}
                    />
                    <SearchTriggerKnobButton
                        activeOpacity={0.86}
                        disabled={searchLoading || disabled}
                        onPressIn={handleClearText}
                    >
                        <SearchTriggerKnobArrow>
                            ×
                        </SearchTriggerKnobArrow>
                    </SearchTriggerKnobButton>
                </SearchTriggerTrack>
            </AnimatedSearchTriggerBarWrap>

            <AnimatedSheetRoot
                pointerEvents={isSheetOpen ? "auto" : "none"}
                style={{ transform: [{ translateY: sheetTranslateY }] }}
            >
                <SheetBackground />
                <AnimatedBottomInputBackdrop
                    pointerEvents="none"
                    style={{
                        height: Animated.add(
                            keyboardOffset,
                            new Animated.Value(78),
                        ),
                    }}
                />

                <AnimatedSheetOverlay
                    pointerEvents="auto"
                    style={{ opacity: overlayOpacity }}
                >
                    <SheetOverlayPressable onPress={closeSheet} />
                </AnimatedSheetOverlay>

                <SearchResultsLayer>
                    <ResultArea showsVerticalScrollIndicator={false}>
                        {searchErrorMessage ? (
                            <PanelErrorText>
                                {searchErrorMessage}
                            </PanelErrorText>
                        ) : null}

                        {searchLoading ? (
                            <StatusText>検索中...</StatusText>
                        ) : null}

                        {!searchLoading && searchResult ? (
                            <ResultBlock>
                                <ResultWord>{searchResult.word}</ResultWord>

                                {searchResult.entries &&
                                searchResult.entries.length > 0 ? (
                                    <Section>
                                        {searchResult.entries.map(
                                            (entry, index) => (
                                                <EntryCard
                                                    key={`${entry.meaning_en}-${index}`}
                                                >
                                                    <EntryMeaning>
                                                        {entry.meaning_en}
                                                    </EntryMeaning>
                                                    <EntryJapanese>
                                                        {entry.meaning_ja}
                                                    </EntryJapanese>
                                                    <EntryExample>
                                                        {entry.example}
                                                    </EntryExample>
                                                </EntryCard>
                                            ),
                                        )}
                                    </Section>
                                ) : null}

                                {searchResult.candidates &&
                                searchResult.candidates.length > 0 ? (
                                    <Section>
                                        <SectionLabel>Candidates</SectionLabel>
                                        {searchResult.candidates.map(
                                            (candidate) => (
                                                <CandidateChip key={candidate}>
                                                    <CandidateText>
                                                        {candidate}
                                                    </CandidateText>
                                                </CandidateChip>
                                            ),
                                        )}
                                    </Section>
                                ) : null}

                                {canAddToMyList ? (
                                    <AddButton
                                        activeOpacity={0.88}
                                        disabled={addToListLoading}
                                        onPress={handleAddToMyList}
                                    >
                                        <AddButtonText>
                                            {addToListLoading
                                                ? "Adding..."
                                                : "Add My List+"}
                                        </AddButtonText>
                                    </AddButton>
                                ) : null}
                            </ResultBlock>
                        ) : null}
                    </ResultArea>
                </SearchResultsLayer>
            </AnimatedSheetRoot>
        </>
    );
};

const SearchTriggerBarWrap = styled.View`
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 16px;
    z-index: 4;
    elevation: 14;
`;

const AnimatedSearchTriggerBarWrap =
    Animated.createAnimatedComponent(SearchTriggerBarWrap);

const BottomInputBackdrop = styled.View`
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 3;
    background-color: #ffffff;
`;

const AnimatedBottomInputBackdrop =
    Animated.createAnimatedComponent(BottomInputBackdrop);

const SearchTriggerTrack = styled.View`
    height: 58px;
    border-radius: 29px;
    border-width: 1px;
    border-color: #c8c8c8;
    background-color: #f7f7f7;
    padding: 8px 10px 8px 18px;
    flex-direction: row;
    align-items: center;
`;

const SearchTriggerInput = styled.TextInput`
    flex: 1;
    height: 100%;
    color: #444444;
    font-size: 14px;
    padding-right: 14px;
`;

const SearchTriggerKnobButton = styled.TouchableOpacity`
    width: 38px;
    height: 38px;
    align-items: center;
    justify-content: center;
`;

const SearchTriggerKnobArrow = styled.Text`
    color: #444444;
    font-size: 18px;
    line-height: 20px;
    font-weight: 700;
`;

const SheetRoot = styled.View`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
`;

const AnimatedSheetRoot = Animated.createAnimatedComponent(SheetRoot);

const SheetBackground = styled.View`
    position: absolute;
    top: ${SHEET_TOP_INSET}px;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: #ffffff;
    border-top-left-radius: 40px;
    border-top-right-radius: 40px;
    border-top-width: 1px;
    border-left-width: 1px;
    border-right-width: 1px;
    border-color: #1f1f1f;
`;

const SheetOverlay = styled(Animated.View)`
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: ${SHEET_TOP_INSET}px;
    z-index: 2;
    background-color: transparent;
`;

const AnimatedSheetOverlay = Animated.createAnimatedComponent(SheetOverlay);

const SheetOverlayPressable = styled(Pressable)`
    flex: 1;
`;

const SearchResultsLayer = styled.View`
    position: absolute;
    top: ${SHEET_TOP_INSET}px;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    padding: 32px 32px 126px;
`;

const ResultArea = styled(ScrollView).attrs({
    keyboardShouldPersistTaps: "always",
})`
    flex: 1;
`;

const PanelErrorText = styled.Text`
    color: #a93030;
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 14px;
`;

const StatusText = styled.Text`
    color: #444444;
    font-size: 14px;
    line-height: 20px;
`;

const ResultBlock = styled.View`
    padding-bottom: 24px;
`;

const ResultWord = styled.Text`
    font-size: 28px;
    line-height: 34px;
    color: #111111;
    font-weight: 700;
    margin-bottom: 24px;
`;

const ResultStatus = styled.Text`
    color: #666666;
    font-size: 13px;
    line-height: 18px;
    margin-bottom: 18px;
`;

const Section = styled.View`
    margin-bottom: 20px;
`;

const SectionLabel = styled.Text`
    color: #111111;
    font-size: 16px;
    line-height: 22px;
    font-weight: 700;
    margin-bottom: 10px;
`;

const EntryCard = styled.View`
    margin-bottom: 14px;
`;

const EntryMeaning = styled.Text`
    color: #181818;
    font-size: 15px;
    line-height: 22px;
    font-weight: 700;
    margin-bottom: 2px;
`;

const EntryJapanese = styled.Text`
    color: #3d3d3d;
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 4px;
`;

const EntryExample = styled.Text`
    color: #555555;
    font-size: 13px;
    line-height: 19px;
`;

const CandidateChip = styled.View`
    align-self: flex-start;
    padding: 9px 14px;
    border-radius: 16px;
    background-color: #f3f3f3;
    margin-bottom: 8px;
`;

const CandidateText = styled.Text`
    color: #222222;
    font-size: 14px;
    font-weight: 600;
`;

const AddButton = styled.TouchableOpacity`
    margin-top: 14px;
    align-self: stretch;
    height: 52px;
    border-radius: 26px;
    border-width: 1px;
    border-color: #1f1f1f;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
`;

const AddButtonText = styled.Text`
    color: #111111;
    font-size: 16px;
    line-height: 20px;
    font-weight: 700;
`;
