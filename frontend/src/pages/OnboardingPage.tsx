import React, { useRef, useState } from "react";
import {
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import styled from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";

const onboardingHero = require("../../assets/onboarding-search-hero.png");

type OnboardingPageProps = {
    onComplete: () => void;
};

const SLIDES = [
    {
        title: "すぐ検索。\nすぐ理解。",
        subtitle: "英単語学習を、もっとシンプルに。",
    },
    {
        title: "すぐ検索",
        subtitle: "知りたい単語を入力",
    },
    {
        title: "すぐ理解",
        subtitle: "意味・例文・発音",
    },
    {
        title: "保存して復習",
        subtitle: "自分だけの単語帳",
    },
] as const;

export const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
    const scrollRef = useRef<ScrollView | null>(null);
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleScrollEnd = (
        event: NativeSyntheticEvent<NativeScrollEvent>,
    ) => {
        const nextIndex = Math.round(
            event.nativeEvent.contentOffset.x / width,
        );
        setCurrentIndex(nextIndex);
    };

    const handleNext = () => {
        if (currentIndex === SLIDES.length - 1) {
            onComplete();
            return;
        }

        const nextIndex = currentIndex + 1;
        scrollRef.current?.scrollTo({
            x: width * nextIndex,
            animated: true,
        });
        setCurrentIndex(nextIndex);
    };

    return (
        <Root>
            <SkipButton activeOpacity={0.8} onPress={onComplete}>
                <SkipText>スキップ</SkipText>
            </SkipButton>

            <Slides
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onMomentumScrollEnd={handleScrollEnd}
            >
                {SLIDES.map((slide, index) => (
                    <Slide key={slide.title} style={{ width }}>
                        <SlideInner>
                            <SlideTitle>{slide.title}</SlideTitle>
                            <SlideSubtitle>{slide.subtitle}</SlideSubtitle>
                            <VisualWrap $topAligned={index > 0}>
                                {index === 0 ? (
                                    <FirstSlideVisual />
                                ) : null}
                                {index === 1 ? (
                                    <SecondSlideVisual />
                                ) : null}
                                {index === 2 ? (
                                    <ThirdSlideVisual />
                                ) : null}
                                {index === 3 ? (
                                    <FourthSlideVisual />
                                ) : null}
                            </VisualWrap>
                        </SlideInner>
                    </Slide>
                ))}
            </Slides>

            <BottomArea>
                <DotsRow>
                    {SLIDES.map((slide, index) => (
                        <Dot
                            key={slide.title}
                            $active={index === currentIndex}
                        />
                    ))}
                </DotsRow>

                <PrimaryButton
                    activeOpacity={0.9}
                    onPress={handleNext}
                >
                    <PrimaryButtonText>
                        {currentIndex === SLIDES.length - 1 ? "はじめる" : "次へ"}
                    </PrimaryButtonText>
                </PrimaryButton>
            </BottomArea>
        </Root>
    );
};

const FirstSlideVisual = () => (
    <HeroImage source={onboardingHero} resizeMode="contain" />
);

const SecondSlideVisual = () => (
    <MockScreen>
        <MockSearchBar>
            <MockSearchValue>hel</MockSearchValue>
            <MockSearchClear>{`\u00d7`}</MockSearchClear>
        </MockSearchBar>
        <PromptText>What do you want to know?</PromptText>
        <KeyboardWrap>
            <SuggestionRow>
                <SuggestionChip>“hel”</SuggestionChip>
                <SuggestionChip>hello</SuggestionChip>
                <SuggestionChip>help</SuggestionChip>
            </SuggestionRow>
            <KeyboardArea>
                {[
                    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
                    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
                    ["z", "x", "c", "v", "b", "n", "m"],
                ].map((row, rowIndex) => (
                    <KeyRow key={`row-${rowIndex}`}>
                        {row.map((key) => (
                            <KeyCap key={key}>
                                <KeyLabel>{key}</KeyLabel>
                            </KeyCap>
                        ))}
                    </KeyRow>
                ))}
                <BottomKeyRow>
                    <WideKeyCap $width={66}>
                        <KeyLabel>123</KeyLabel>
                    </WideKeyCap>
                    <WideKeyCap $width={160}>
                        <KeyLabel>space</KeyLabel>
                    </WideKeyCap>
                    <WideKeyCap $width={90}>
                        <KeyLabel>return</KeyLabel>
                    </WideKeyCap>
                </BottomKeyRow>
            </KeyboardArea>
        </KeyboardWrap>
    </MockScreen>
);

const ThirdSlideVisual = () => (
    <CompactMockScreen>
        <MockSearchBar>
            <MockSearchValue>Hello</MockSearchValue>
            <MockSearchClear>{`\u00d7`}</MockSearchClear>
        </MockSearchBar>
        <ResultWord>hello</ResultWord>
        <PronounceButton>
            <Feather name="volume-2" size={18} color="#222222" />
            <PronounceLabel>発音を聞く</PronounceLabel>
        </PronounceButton>
        <MeaningTitle>used as a greeting</MeaningTitle>
        <MeaningJa>あいさつとして使う「こんにちは／やあ」</MeaningJa>
        <MeaningExample>Hello! How are you?</MeaningExample>
        <AddButton>
            <AddButtonText>Add My List+</AddButtonText>
        </AddButton>
    </CompactMockScreen>
);

const FourthSlideVisual = () => (
    <CompactMockScreen>
        <ListSearchBar>
            <ListSearchPlaceholder>登録した単語を検索</ListSearchPlaceholder>
            <Feather name="search" size={16} color="#4a4a4a" />
        </ListSearchBar>
        <WordCard>
            <WordCardText>hello</WordCardText>
            <Feather name="trash-2" size={18} color="#d9485f" />
        </WordCard>
        <WordCard>
            <WordCardText>keep</WordCardText>
            <Feather name="trash-2" size={18} color="#d9485f" />
        </WordCard>
        <WordCard>
            <WordCardText>moving</WordCardText>
            <Feather name="trash-2" size={18} color="#d9485f" />
        </WordCard>
        <WordCard>
            <WordCardText>forward</WordCardText>
            <Feather name="trash-2" size={18} color="#d9485f" />
        </WordCard>
    </CompactMockScreen>
);

const Root = styled(SafeAreaView)`
    flex: 1;
    background-color: #ffffff;
`;

const SkipButton = styled.TouchableOpacity`
    position: absolute;
    top: 48px;
    right: 28px;
    z-index: 10;
`;

const SkipText = styled.Text`
    color: #8b8b8b;
    font-size: 15px;
    font-weight: 600;
`;

const Slides = styled(ScrollView)`
    flex: 1;
`;

const Slide = styled.View`
    flex: 1;
`;

const SlideInner = styled.View`
    flex: 1;
    padding: 86px 34px 36px;
    align-items: center;
`;

const SlideTitle = styled.Text`
    color: #111111;
    font-size: 30px;
    line-height: 40px;
    font-weight: 800;
    text-align: center;
`;

const SlideSubtitle = styled.Text`
    margin-top: 12px;
    margin-bottom: 18px;
    color: #444444;
    font-size: 17px;
    line-height: 24px;
    text-align: center;
`;

const VisualWrap = styled.View<{ $topAligned: boolean }>`
    flex: 1;
    width: 100%;
    justify-content: ${(props: { $topAligned: boolean }) =>
        props.$topAligned ? "flex-start" : "center"};
    align-items: center;
    padding-top: 12px;
`;

const HeroImage = styled(Image)`
    width: 100%;
    height: 420px;
`;

const MockScreen = styled.View`
    width: 100%;
    min-height: 440px;
`;

const CompactMockScreen = styled.View`
    width: 100%;
    min-height: 408px;
    padding: 0 0 8px;
`;

const MockBackText = styled.Text`
    color: #151515;
    font-size: 28px;
    font-weight: 500;
    margin-bottom: 16px;
`;

const MockSearchBar = styled.View`
    height: 52px;
    border-radius: 26px;
    border-width: 1px;
    border-color: #dddddd;
    padding: 0 18px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: #ffffff;
`;

const MockSearchValue = styled.Text`
    color: #161616;
    font-size: 18px;
    font-weight: 500;
`;

const MockSearchClear = styled.Text`
    color: #363636;
    font-size: 22px;
`;

const PromptText = styled.Text`
    margin-top: 56px;
    margin-bottom: 36px;
    color: #8b8b8b;
    font-size: 18px;
    text-align: center;
`;

const KeyboardWrap = styled.View`
    margin-top: auto;
    margin-left: -34px;
    margin-right: -34px;
    background-color: #e9e9ee;
    border-top-width: 1px;
    border-top-color: #d5d5dc;
`;

const SuggestionRow = styled.View`
    flex-direction: row;
    justify-content: space-around;
    padding: 10px 14px 8px;
    background-color: #dbdce2;
`;

const SuggestionChip = styled.Text`
    color: #242424;
    font-size: 14px;
    font-weight: 500;
`;

const KeyboardArea = styled.View`
    padding: 10px 10px 16px;
`;

const KeyRow = styled.View`
    flex-direction: row;
    justify-content: center;
    margin-bottom: 8px;
`;

const KeyCap = styled.View`
    width: 29px;
    height: 40px;
    border-radius: 6px;
    background-color: #ffffff;
    justify-content: center;
    align-items: center;
    margin: 0 2px;
`;

const WideKeyCap = styled.View<{ $width: number }>`
    width: ${(props: { $width: number }) => props.$width}px;
    height: 42px;
    border-radius: 8px;
    background-color: #ffffff;
    justify-content: center;
    align-items: center;
    margin: 0 4px;
`;

const BottomKeyRow = styled.View`
    flex-direction: row;
    justify-content: center;
    margin-top: 4px;
`;

const KeyLabel = styled.Text`
    color: #1a1a1a;
    font-size: 16px;
    font-weight: 500;
`;

const ResultWord = styled.Text`
    margin-top: 28px;
    color: #111111;
    font-size: 54px;
    line-height: 60px;
    font-weight: 800;
`;

const PronounceButton = styled.View`
    margin-top: 14px;
    align-self: flex-start;
    flex-direction: row;
    align-items: center;
    padding: 10px 14px;
    border-radius: 24px;
    background-color: #f5f5f5;
`;

const PronounceLabel = styled.Text`
    color: #111111;
    font-size: 14px;
    font-weight: 700;
    margin-left: 8px;
`;

const MeaningTitle = styled.Text`
    margin-top: 28px;
    color: #1d1d1d;
    font-size: 15px;
    line-height: 22px;
    font-weight: 800;
`;

const MeaningJa = styled.Text`
    margin-top: 6px;
    color: #303030;
    font-size: 14px;
    line-height: 22px;
`;

const MeaningExample = styled.Text`
    margin-top: 10px;
    margin-bottom: 26px;
    color: #515151;
    font-size: 14px;
    line-height: 22px;
`;

const AddButton = styled.View`
    margin-top: auto;
    height: 48px;
    border-radius: 24px;
    border-width: 1.5px;
    border-color: #181818;
    align-items: center;
    justify-content: center;
`;

const AddButtonText = styled.Text`
    color: #111111;
    font-size: 16px;
    font-weight: 800;
`;

const ListSearchBar = styled.View`
    height: 52px;
    border-radius: 26px;
    border-width: 1px;
    border-color: #dddddd;
    padding: 0 18px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: #ffffff;
`;

const ListSearchPlaceholder = styled.Text`
    color: #999999;
    font-size: 17px;
`;

const WordCard = styled.View`
    margin-top: 26px;
    height: 66px;
    border-radius: 18px;
    border-width: 1px;
    border-color: #ececec;
    padding: 0 18px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: #ffffff;
`;

const WordCardText = styled.Text`
    color: #111111;
    font-size: 18px;
    font-weight: 700;
`;

const BottomArea = styled.View`
    padding: 0 34px 28px;
`;

const DotsRow = styled.View`
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin-bottom: 22px;
`;

const Dot = styled.View<{ $active: boolean }>`
    width: 10px;
    height: 10px;
    border-radius: 5px;
    margin: 0 5px;
    background-color: ${(props: { $active: boolean }) =>
        props.$active ? "#111111" : "#dddddd"};
`;

const PrimaryButton = styled.TouchableOpacity`
    height: 56px;
    border-radius: 28px;
    background-color: #111111;
    align-items: center;
    justify-content: center;
`;

const PrimaryButtonText = styled.Text`
    color: #ffffff;
    font-size: 17px;
    font-weight: 700;
`;
