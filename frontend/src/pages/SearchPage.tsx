import React, { useEffect, useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { Animated, Easing } from "react-native";
import styled from "styled-components/native";

import { ScreenLayout } from "../layout/ScreenLayout";
import { SearchResult } from "../types";

type SearchPageProps = {
    searchText: string;
    searchLoading: boolean;
    addToListLoading: boolean;
    canAddToMyList: boolean;
    guestUpgradePromptVisible: boolean;
    guestUpgradePromptTitle: string;
    guestUpgradePromptMessage: string;
    searchBonusPromptVisible: boolean;
    searchBonusPromptLoading: boolean;
    searchBonusPromptTitle: string;
    searchBonusPromptMessage: string;
    searchBonusPromptErrorMessage: string | null;
    searchErrorMessage: string | null;
    searchResult: SearchResult | null;
    onBack: () => void;
    onChangeSearchText: (value: string) => void;
    onSubmitSearch: () => void;
    onAddSearchResultToMyList: () => Promise<boolean>;
    onCloseGuestUpgradePrompt: () => void;
    onCloseSearchBonusPrompt: () => void;
    onNavigateSignUpFromGuestPrompt: () => void;
    onWatchSearchBonusAd: () => void;
};

export const SearchPage = ({
    searchText,
    searchLoading,
    addToListLoading,
    canAddToMyList,
    guestUpgradePromptVisible,
    guestUpgradePromptTitle,
    guestUpgradePromptMessage,
    searchBonusPromptVisible,
    searchBonusPromptLoading,
    searchBonusPromptTitle,
    searchBonusPromptMessage,
    searchBonusPromptErrorMessage,
    searchErrorMessage,
    searchResult,
    onBack,
    onChangeSearchText,
    onSubmitSearch,
    onAddSearchResultToMyList,
    onCloseGuestUpgradePrompt,
    onCloseSearchBonusPrompt,
    onNavigateSignUpFromGuestPrompt,
    onWatchSearchBonusAd,
}: SearchPageProps) => {
    const loadingProgress = useRef(new Animated.Value(0)).current;
    const [addedToMyList, setAddedToMyList] = useState(false);
    const canShowAddToMyListButton =
        canAddToMyList &&
        searchResult?.status === "SUCCESS" &&
        Boolean(searchResult.word) &&
        Boolean(searchResult.entries && searchResult.entries.length > 0);
    const showPronunciationButton =
        searchResult?.status === "SUCCESS" && Boolean(searchResult?.word);

    const handlePronounceWord = async () => {
        const word = searchResult?.word?.trim();

        if (!word) {
            return;
        }

        await Speech.stop();
        Speech.speak(word, {
            language: "en-US",
            pitch: 1,
            rate: 0.9,
            useApplicationAudioSession: false,
            onStart: () => {
                console.log("Speech started:", word);
            },
            onDone: () => {
                console.log("Speech finished:", word);
            },
            onStopped: () => {
                console.log("Speech stopped:", word);
            },
            onError: (error) => {
                console.log("Speech error:", error);
            },
        });
    };

    const handleAddToMyList = async () => {
        const added = await onAddSearchResultToMyList();

        if (added) {
            setAddedToMyList(true);
        }
    };

    useEffect(() => {
        if (!searchLoading) {
            loadingProgress.stopAnimation();
            loadingProgress.setValue(0);
            return;
        }

        const loop = Animated.loop(
            Animated.timing(loadingProgress, {
                toValue: 1,
                duration: 1080,
                easing: Easing.linear,
                useNativeDriver: false,
            }),
        );

        loadingProgress.setValue(0);
        loop.start();

        return () => {
            loop.stop();
            loadingProgress.stopAnimation();
            loadingProgress.setValue(0);
        };
    }, [loadingProgress, searchLoading]);

    useEffect(() => {
        setAddedToMyList(false);
    }, [searchResult?.word, searchResult?.status]);

    const loadingLabel = `Looking up ${searchText.trim() || "word"}`;
    const fixedOverlay =
        guestUpgradePromptVisible || searchBonusPromptVisible ? (
            <>
                {guestUpgradePromptVisible ? (
                    <GuestPromptOverlay>
                        <GuestPromptCard>
                            <GuestPromptTitle>
                                {guestUpgradePromptTitle}
                            </GuestPromptTitle>
                            <GuestPromptMessage>
                                {guestUpgradePromptMessage}
                            </GuestPromptMessage>
                            <GuestPromptActions>
                                <GuestPromptSecondaryButton
                                    activeOpacity={0.84}
                                    onPress={onCloseGuestUpgradePrompt}
                                >
                                    <GuestPromptSecondaryText>
                                        あとで
                                    </GuestPromptSecondaryText>
                                </GuestPromptSecondaryButton>
                                <GuestPromptPrimaryButton
                                    activeOpacity={0.84}
                                    onPress={onNavigateSignUpFromGuestPrompt}
                                >
                                    <GuestPromptPrimaryText>
                                        アカウントを作成
                                    </GuestPromptPrimaryText>
                                </GuestPromptPrimaryButton>
                            </GuestPromptActions>
                        </GuestPromptCard>
                    </GuestPromptOverlay>
                ) : null}

                {searchBonusPromptVisible ? (
                    <SearchBonusOverlay>
                        <SearchBonusCard>
                            <SearchBonusTitle>
                                {searchBonusPromptTitle}
                            </SearchBonusTitle>
                            <SearchBonusMessage>
                                {searchBonusPromptMessage}
                            </SearchBonusMessage>
                            {searchBonusPromptErrorMessage ? (
                                <SearchBonusErrorText>
                                    {searchBonusPromptErrorMessage}
                                </SearchBonusErrorText>
                            ) : null}
                            <SearchBonusActions>
                                <SearchBonusSecondaryButton
                                    activeOpacity={0.84}
                                    disabled={searchBonusPromptLoading}
                                    onPress={onCloseSearchBonusPrompt}
                                >
                                    <SearchBonusSecondaryText>
                                        あとで
                                    </SearchBonusSecondaryText>
                                </SearchBonusSecondaryButton>
                                <SearchBonusPrimaryButton
                                    activeOpacity={0.84}
                                    disabled={searchBonusPromptLoading}
                                    onPress={onWatchSearchBonusAd}
                                >
                                    <SearchBonusPrimaryText>
                                        {searchBonusPromptLoading
                                            ? "広告を準備中..."
                                            : "広告を見る"}
                                    </SearchBonusPrimaryText>
                                </SearchBonusPrimaryButton>
                            </SearchBonusActions>
                        </SearchBonusCard>
                    </SearchBonusOverlay>
                ) : null}
            </>
        ) : null;

    return (
        <ScreenLayout fixedOverlay={fixedOverlay}>
            <TopRow>
                <BackButton onPress={onBack}>
                    <BackIcon>←</BackIcon>
                </BackButton>
            </TopRow>

            <SearchTrack>
                <SearchInput
                    autoFocus
                    editable={!searchLoading}
                    placeholder="検索したい単語を入力"
                    placeholderTextColor="#8f8f8f"
                    returnKeyType="search"
                    value={searchText}
                    onChangeText={onChangeSearchText}
                    onSubmitEditing={onSubmitSearch}
                />
                <ClearButton
                    activeOpacity={0.86}
                    disabled={searchLoading}
                    onPress={() => onChangeSearchText("")}
                >
                    <ClearText>×</ClearText>
                </ClearButton>
            </SearchTrack>

            <ResultArea showsVerticalScrollIndicator={false}>
                {searchErrorMessage ? (
                    <PanelErrorText>{searchErrorMessage}</PanelErrorText>
                ) : null}

                {searchLoading ? (
                    <LoadingState>
                        <LoadingTitle>{loadingLabel}</LoadingTitle>
                        <LoadingDotsRow>
                            {[0, 1, 2].map((index) => {
                                const start = index / 3;
                                const peak = start + 0.12;
                                const end = start + 0.24;

                                return (
                                    <AnimatedLoadingDot
                                        key={index}
                                        style={{
                                            backgroundColor:
                                                loadingProgress.interpolate({
                                                    inputRange: [start, peak, end, 1],
                                                    outputRange: [
                                                        "#c7c7c7",
                                                        "#1f1f1f",
                                                        "#c7c7c7",
                                                        "#c7c7c7",
                                                    ],
                                                    extrapolate: "clamp",
                                                }),
                                        }}
                                    />
                                );
                            })}
                        </LoadingDotsRow>
                    </LoadingState>
                ) : null}

                {!searchLoading && searchResult ? (
                    <ResultBlock>
                        <ResultWord>{searchResult.word}</ResultWord>
                        {showPronunciationButton ? (
                            <PronunciationButton
                                activeOpacity={0.82}
                                onPress={handlePronounceWord}
                            >
                                <Feather
                                    name="volume-2"
                                    size={20}
                                    color="#222222"
                                />
                                <PronunciationButtonText>
                                    発音を聞く
                                </PronunciationButtonText>
                            </PronunciationButton>
                        ) : null}

                        {searchResult.entries && searchResult.entries.length > 0 ? (
                            <Section>
                                {searchResult.entries.map((entry, index) => (
                                    <EntryCard key={`${entry.meaning_en}-${index}`}>
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
                                ))}
                            </Section>
                        ) : null}

                        {searchResult.candidates &&
                        searchResult.candidates.length > 0 ? (
                            <CandidateSection>
                                {searchResult.candidates.map((candidate) => (
                                    <CandidateChip key={candidate}>
                                        <CandidateText>{candidate}</CandidateText>
                                    </CandidateChip>
                                ))}
                                <CandidateHintText>
                                    検索したい単語はこれでしょうか？
                                </CandidateHintText>
                            </CandidateSection>
                        ) : null}

                        {canShowAddToMyListButton ? (
                            <AddButton
                                activeOpacity={0.88}
                                disabled={addToListLoading || addedToMyList}
                                onPress={handleAddToMyList}
                                $success={addedToMyList}
                            >
                                {addedToMyList ? (
                                    <Feather
                                        name="check"
                                        size={18}
                                        color="#2e8b57"
                                    />
                                ) : null}
                                <AddButtonText $success={addedToMyList}>
                                    {addToListLoading
                                        ? "Adding..."
                                        : addedToMyList
                                          ? "Added to My List"
                                          : "Add My List+"}
                                </AddButtonText>
                            </AddButton>
                        ) : null}
                    </ResultBlock>
                ) : null}
            </ResultArea>
        </ScreenLayout>
    );
};

const TopRow = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 24px;
`;

const BackButton = styled.TouchableOpacity`
    width: 28px;
    height: 28px;
    justify-content: center;
`;

const BackIcon = styled.Text`
    color: #181818;
    font-size: 26px;
    line-height: 26px;
    font-weight: 500;
`;

const SearchTrack = styled.View`
    height: 58px;
    border-radius: 29px;
    border-width: 1px;
    border-color: #c8c8c8;
    background-color: #f7f7f7;
    padding: 8px 10px 8px 18px;
    flex-direction: row;
    align-items: center;
    margin-bottom: 24px;
`;

const SearchInput = styled.TextInput`
    flex: 1;
    height: 100%;
    color: #444444;
    font-size: 14px;
    padding-right: 14px;
`;

const ClearButton = styled.TouchableOpacity`
    width: 38px;
    height: 38px;
    align-items: center;
    justify-content: center;
`;

const ClearText = styled.Text`
    color: #444444;
    font-size: 18px;
    line-height: 20px;
    font-weight: 700;
`;

const ResultArea = styled.ScrollView.attrs({
    contentContainerStyle: {
        flexGrow: 1,
    },
})`
    flex: 1;
`;

const PanelErrorText = styled.Text`
    color: #a93030;
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 14px;
`;

const LoadingState = styled.View`
    flex: 1;
    min-height: 360px;
    align-items: center;
    justify-content: center;
    padding-bottom: 84px;
`;

const LoadingTitle = styled.Text`
    color: #111111;
    font-size: 24px;
    line-height: 30px;
    font-weight: 700;
    margin-bottom: 18px;
`;

const LoadingDotsRow = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: center;
`;

const LoadingDot = styled.View`
    width: 18px;
    height: 18px;
    border-radius: 9px;
    margin: 0 6px;
    background-color: #c7c7c7;
`;

const AnimatedLoadingDot = Animated.createAnimatedComponent(LoadingDot);

const ResultBlock = styled.View`
    padding-bottom: 24px;
`;

const ResultWord = styled.Text`
    font-size: 28px;
    line-height: 34px;
    color: #111111;
    font-weight: 700;
    margin-bottom: 14px;
`;

const PronunciationButton = styled.TouchableOpacity`
    align-self: flex-start;
    min-height: 38px;
    padding: 8px 12px;
    border-radius: 19px;
    background-color: #f3f3f3;
    flex-direction: row;
    align-items: center;
    margin-bottom: 22px;
`;

const PronunciationButtonText = styled.Text`
    margin-left: 8px;
    color: #222222;
    font-size: 13px;
    line-height: 18px;
    font-weight: 700;
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
    align-self: stretch;
    min-height: 58px;
    padding: 14px 18px;
    border-radius: 29px;
    border-width: 1px;
    border-color: #d7d7d7;
    background-color: #f7f7f7;
    margin-bottom: 12px;
    align-items: center;
    justify-content: center;
`;

const CandidateText = styled.Text`
    color: #222222;
    font-size: 20px;
    line-height: 24px;
    font-weight: 700;
`;

const CandidateSection = styled.View`
    margin-bottom: 20px;
    align-self: stretch;
    justify-content: center;
`;

const CandidateHintText = styled.Text`
    margin-top: 10px;
    color: #555555;
    font-size: 14px;
    line-height: 20px;
    text-align: center;
`;

const AddButton = styled.TouchableOpacity<{ $success: boolean }>`
    margin-top: 14px;
    align-self: stretch;
    height: 52px;
    border-radius: 26px;
    border-width: 1px;
    border-color: ${(props: { $success: boolean }) =>
        props.$success ? "#86c79d" : "#1f1f1f"};
    align-items: center;
    justify-content: center;
    flex-direction: row;
    background-color: ${(props: { $success: boolean }) =>
        props.$success ? "#f3fbf5" : "#ffffff"};
`;

const AddButtonText = styled.Text<{ $success: boolean }>`
    color: ${(props: { $success: boolean }) =>
        props.$success ? "#2e8b57" : "#111111"};
    font-size: 16px;
    line-height: 20px;
    font-weight: 700;
    margin-left: ${(props: { $success: boolean }) =>
        props.$success ? "8px" : "0px"};
`;

const GuestPromptOverlay = styled.View`
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    background-color: rgba(0, 0, 0, 0.18);
    align-items: center;
    justify-content: center;
    padding: 0 24px;
`;

const GuestPromptCard = styled.View`
    width: 100%;
    max-width: 360px;
    border-radius: 24px;
    background-color: #ffffff;
    padding: 24px 22px 20px;
`;

const GuestPromptTitle = styled.Text`
    color: #161616;
    font-size: 22px;
    line-height: 28px;
    font-weight: 700;
    margin-bottom: 12px;
`;

const GuestPromptMessage = styled.Text`
    color: #555555;
    font-size: 14px;
    line-height: 21px;
    margin-bottom: 20px;
`;

const GuestPromptActions = styled.View`
    flex-direction: row;
    justify-content: flex-end;
`;

const GuestPromptSecondaryButton = styled.TouchableOpacity`
    min-width: 108px;
    height: 44px;
    border-radius: 14px;
    border-width: 1px;
    border-color: #cfcfcf;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    padding: 0 16px;
`;

const GuestPromptSecondaryText = styled.Text`
    color: #2f2f2f;
    font-size: 15px;
    font-weight: 600;
`;

const GuestPromptPrimaryButton = styled.TouchableOpacity`
    min-width: 132px;
    height: 44px;
    border-radius: 14px;
    background-color: #1f1f1f;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
`;

const GuestPromptPrimaryText = styled.Text`
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
`;

const SearchBonusOverlay = styled.View`
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    background-color: rgba(0, 0, 0, 0.18);
    align-items: center;
    justify-content: center;
    padding: 0 24px;
`;

const SearchBonusCard = styled.View`
    width: 100%;
    max-width: 360px;
    border-radius: 24px;
    background-color: #ffffff;
    padding: 24px 22px 20px;
`;

const SearchBonusTitle = styled.Text`
    color: #161616;
    font-size: 22px;
    line-height: 28px;
    font-weight: 700;
    margin-bottom: 12px;
`;

const SearchBonusMessage = styled.Text`
    color: #555555;
    font-size: 14px;
    line-height: 21px;
`;

const SearchBonusErrorText = styled.Text`
    color: #a93030;
    font-size: 13px;
    line-height: 19px;
    margin-top: 12px;
`;

const SearchBonusActions = styled.View`
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 20px;
`;

const SearchBonusSecondaryButton = styled.TouchableOpacity`
    min-width: 108px;
    height: 44px;
    border-radius: 14px;
    border-width: 1px;
    border-color: #cfcfcf;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    padding: 0 16px;
`;

const SearchBonusSecondaryText = styled.Text`
    color: #2f2f2f;
    font-size: 15px;
    font-weight: 600;
`;

const SearchBonusPrimaryButton = styled.TouchableOpacity`
    min-width: 132px;
    height: 44px;
    border-radius: 14px;
    background-color: #1f1f1f;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
`;

const SearchBonusPrimaryText = styled.Text`
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
`;
