import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    GestureResponderEvent,
    PanResponder,
    Pressable,
    useWindowDimensions,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import styled from "styled-components/native";

import { BottomNavigation } from "../components/BottomNavigation";
import { API_BASE_URL } from "../config/api";
import { ScreenLayout } from "../layout/ScreenLayout";
import { WORD_DISPLAY_FONT_FAMILY } from "../styles/fonts";
import type { WordDetailItem, WordItem } from "../types";

type CardPageProps = {
    words: WordItem[];
    authToken?: string | null;
    onOpenHome: () => void;
    onOpenSearch: () => void;
};

const SWIPE_DISTANCE = 110;
const TAP_DISTANCE = 8;
const CARD_ASPECT_RATIO = 260 / 460;

export const CardPage = ({
    words = [],
    authToken,
    onOpenHome,
    onOpenSearch,
}: CardPageProps) => {
    const { width } = useWindowDimensions();
    const position = useRef(new Animated.ValueXY()).current;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [showTapHint, setShowTapHint] = useState(true);
    const [detailCache, setDetailCache] = useState<Record<number, WordDetailItem>>(
        {},
    );

    const cards = useMemo(() => words.filter((word) => word.word?.trim()), [words]);
    const currentWord = cards[currentIndex];
    const nextWord = cards[currentIndex + 1];
    const currentDetail = currentWord ? detailCache[currentWord.id] : undefined;
    const currentEntries = currentDetail?.entries ?? [];
    const shouldShowTapHint = showTapHint && currentIndex === 0;

    useEffect(() => {
        if (!authToken || cards.length === 0) {
            return;
        }

        const prefetchWords = cards
            .slice(currentIndex, currentIndex + 5)
            .filter((word) => !detailCache[word.id]);

        if (prefetchWords.length === 0) {
            return;
        }

        let cancelled = false;

        const prefetchDetails = async () => {
            const details = await Promise.all(
                prefetchWords.map(async (word) => {
                    try {
                        const response = await fetch(
                            `${API_BASE_URL}/api/v1/words/${word.id}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${authToken}`,
                                },
                            },
                        );

                        if (!response.ok) {
                            return null;
                        }

                        return {
                            wordId: word.id,
                            detail: (await response.json()) as WordDetailItem,
                        };
                    } catch {
                        return null;
                    }
                }),
            );

            if (cancelled) {
                return;
            }

            setDetailCache((current) => {
                const next = { ...current };

                details.forEach((item) => {
                    if (item) {
                        next[item.wordId] = item.detail;
                    }
                });

                return next;
            });
        };

        void prefetchDetails();

        return () => {
            cancelled = true;
        };
    }, [authToken, cards, currentIndex, detailCache]);

    const resetCard = () => {
        position.setValue({ x: 0, y: 0 });
        setFlipped(false);
    };

    const goToNextCard = (direction: 1 | -1) => {
        Animated.timing(position, {
            toValue: { x: direction * width, y: 24 },
            duration: 220,
            useNativeDriver: true,
        }).start(() => {
            setCurrentIndex((index) => (index + 1 >= cards.length ? 0 : index + 1));
            resetCard();
        });
    };

    const returnCard = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 7,
            tension: 70,
            useNativeDriver: true,
        }).start();
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_event, gesture) =>
                Math.abs(gesture.dx) > TAP_DISTANCE ||
                Math.abs(gesture.dy) > TAP_DISTANCE,
            onPanResponderMove: Animated.event(
                [null, { dx: position.x, dy: position.y }],
                { useNativeDriver: false },
            ),
            onPanResponderRelease: (_event, gesture) => {
                if (gesture.dx > SWIPE_DISTANCE) {
                    goToNextCard(1);
                    return;
                }

                if (gesture.dx < -SWIPE_DISTANCE) {
                    goToNextCard(-1);
                    return;
                }

                returnCard();
            },
        }),
    ).current;

    const rotate = position.x.interpolate({
        inputRange: [-width, 0, width],
        outputRange: ["-12deg", "0deg", "12deg"],
        extrapolate: "clamp",
    });

    const handlePronounceWord = async () => {
        const text = currentWord?.word?.trim();

        if (!text) {
            return;
        }

        await Speech.stop();
        Speech.speak(text, {
            language: "en-US",
            pitch: 1,
            rate: 0.9,
            useApplicationAudioSession: false,
        });
    };

    const handlePronunciationPress = (event: GestureResponderEvent) => {
        event.stopPropagation();
        void handlePronounceWord();
    };

    return (
        <ScreenLayout
            contentFillsViewport
            horizontalPadding={24}
            scrollable={false}
            fixedBottom={
                <BottomNavigation
                    activeTab="cards"
                    onOpenHome={onOpenHome}
                    onOpenSearch={onOpenSearch}
                    onOpenCards={() => undefined}
                />
            }
        >
            <CardStage>
                {cards.length === 0 ? (
                    <EmptyText>No cards yet.</EmptyText>
                ) : (
                    <>
                        <CardDeck>
                            {nextWord ? (
                                <StackCard $depth={1}>
                                    <CardFrontContent>
                                        <CardWord>{nextWord.word}</CardWord>
                                        <TapHintArea $visible={false}>
                                            <TapIconWrap>
                                                <MaterialCommunityIcons
                                                    name="gesture-tap"
                                                    size={34}
                                                    color="#202020"
                                                />
                                            </TapIconWrap>
                                            <TapHint>
                                                Tap to reveal the meaning
                                            </TapHint>
                                            <TapHint>
                                                意味と例文を確認してみよう!
                                            </TapHint>
                                        </TapHintArea>
                                    </CardFrontContent>
                                </StackCard>
                            ) : null}
                            <AnimatedCard
                                {...panResponder.panHandlers}
                                style={{
                                    transform: [
                                        { translateX: position.x },
                                        { translateY: position.y },
                                        { rotate },
                                    ],
                                }}
                            >
                                <Pressable
                                    onPress={() => {
                                        setFlipped((current) => !current);
                                        setShowTapHint(false);
                                    }}
                                >
                                    <CardFace $flipped={flipped}>
                                        {!flipped ? (
                                            <CardFrontContent>
                                                <CardWord>
                                                    {currentWord.word}
                                                </CardWord>
                                                <TapHintArea
                                                    $visible={shouldShowTapHint}
                                                >
                                                        <TapIconWrap>
                                                            <MaterialCommunityIcons
                                                                name="gesture-tap"
                                                                size={34}
                                                                color="#202020"
                                                            />
                                                        </TapIconWrap>
                                                        <TapHint>
                                                            Tap to reveal the
                                                            meaning
                                                        </TapHint>
                                                        <TapHint>
                                                            意味と例文を確認してみよう!
                                                        </TapHint>
                                                </TapHintArea>
                                            </CardFrontContent>
                                        ) : (
                                            <CardBackContent>
                                                <PronunciationButton
                                                    activeOpacity={0.82}
                                                    onPress={
                                                        handlePronunciationPress
                                                    }
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
                                                {currentEntries.length > 0 ? (
                                                    currentEntries
                                                        .slice(0, 2)
                                                        .map((entry) => (
                                                            <MeaningBlock
                                                                key={`${entry.meaning_en}-${entry.meaning_ja}`}
                                                            >
                                                                <MeaningText>
                                                                    {
                                                                        entry.meaning_en
                                                                    }
                                                                </MeaningText>
                                                                <SubMeaningText>
                                                                    {
                                                                        entry.meaning_ja
                                                                    }
                                                                </SubMeaningText>
                                                                {entry.example ? (
                                                                    <ExampleText>
                                                                        {
                                                                            entry.example
                                                                        }
                                                                    </ExampleText>
                                                                ) : null}
                                                            </MeaningBlock>
                                                        ))
                                                ) : (
                                                    <MeaningBlock>
                                                        <MeaningText>
                                                            {currentWord.meaningJapanese ||
                                                                currentWord.meaning ||
                                                                "No meaning registered."}
                                                        </MeaningText>
                                                        {currentWord.meaningEnglish ? (
                                                            <SubMeaningText>
                                                                {
                                                                    currentWord.meaningEnglish
                                                                }
                                                            </SubMeaningText>
                                                        ) : null}
                                                        {currentWord.memo ? (
                                                            <ExampleText>
                                                                {
                                                                    currentWord.memo
                                                                }
                                                            </ExampleText>
                                                        ) : null}
                                                    </MeaningBlock>
                                                )}
                                            </CardBackContent>
                                        )}
                                    </CardFace>
                                </Pressable>
                            </AnimatedCard>
                        </CardDeck>
                        <CounterText>
                            {currentIndex + 1} / {cards.length}
                        </CounterText>
                    </>
                )}
            </CardStage>
        </ScreenLayout>
    );
};

const CardStage = styled.View`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding-bottom: 86px;
`;

const CardDeck = styled.View`
    align-self: stretch;
    aspect-ratio: ${CARD_ASPECT_RATIO};
`;

const StackCard = styled.View<{ $depth: number }>`
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    border-radius: 24px;
    background-color: #ffffff;
    border-width: 2px;
    border-color: #111111;
    align-items: center;
    justify-content: center;
    padding: 128px 32px 28px;
    transform: translateX(-9px) rotate(0deg)
        scale(${(props: { $depth: number }) => 1 - props.$depth * 0.01});
`;

const AnimatedCard = styled(Animated.View)`
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    width: 100%;
`;

const CardFace = styled.View<{ $flipped: boolean }>`
    height: 100%;
    border-radius: 24px;
    background-color: #ffffff;
    border-width: 2px;
    border-color: #111111;
    align-items: center;
    justify-content: ${(props: { $flipped: boolean }) =>
        props.$flipped ? "flex-start" : "center"};
    padding: ${(props: { $flipped: boolean }) =>
        props.$flipped ? "46px 26px 28px" : "128px 32px 28px"};
`;

const CardFrontContent = styled.View`
    align-items: center;
    transform: translateY(-20px);
`;

const CardWord = styled.Text`
    font-family: ${WORD_DISPLAY_FONT_FAMILY};
    color: #111111;
    font-size: 42px;
    line-height: 50px;
    font-weight: 800;
    text-align: center;
`;

const TapIconWrap = styled.View`
    width: 34px;
    height: 34px;
    align-items: center;
    justify-content: center;
    margin-top: 22px;
    margin-bottom: 12px;
`;

const TapHintArea = styled.View<{ $visible: boolean }>`
    align-items: center;
    opacity: ${(props: { $visible: boolean }) => (props.$visible ? 1 : 0)};
`;

const TapHint = styled.Text`
    color: #222222;
    font-size: 12px;
    line-height: 16px;
    font-weight: 600;
    text-align: center;
`;

const CardBackContent = styled.View`
    align-self: stretch;
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

const MeaningBlock = styled.View`
    margin-bottom: 12px;
`;

const MeaningText = styled.Text`
    color: #181818;
    font-size: 15px;
    line-height: 22px;
    font-weight: 700;
    margin-bottom: 2px;
`;

const SubMeaningText = styled.Text`
    color: #3d3d3d;
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 4px;
`;

const ExampleText = styled.Text`
    color: #555555;
    font-size: 13px;
    line-height: 19px;
`;

const CounterText = styled.Text`
    margin-top: 24px;
    color: #8a8a8e;
    font-size: 13px;
    line-height: 18px;
    font-weight: 700;
`;

const EmptyText = styled.Text`
    color: #8f8f8f;
    font-size: 18px;
    line-height: 26px;
    font-weight: 600;
`;
