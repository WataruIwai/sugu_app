import React, { useRef, useState } from "react";
import {
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import styled from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";

const onboardingLookupImage = require("../../assets/onboarding-lookup-final.png");
const onboardingSearchImage = require("../../assets/onboarding-search-final.png");
const onboardingSaveImage = require("../../assets/onboarding-save-final.png");
const onboardingWidgetImage = require("../../assets/onboarding-widget-final.png");

type OnboardingPageProps = {
    onComplete: () => void;
};

const SLIDES = [
    {
        image: onboardingLookupImage,
    },
    {
        image: onboardingSearchImage,
    },
    {
        image: onboardingSaveImage,
    },
    {
        image: onboardingWidgetImage,
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
                    <Slide key={`onboarding-${index}`} style={{ width }}>
                        <SlideInner>
                            <OnboardingImage
                                source={slide.image}
                                resizeMode="contain"
                            />
                        </SlideInner>
                    </Slide>
                ))}
            </Slides>

            <BottomArea>
                <DotsRow>
                    {SLIDES.map((_, index) => (
                        <Dot
                            key={`dot-${index}`}
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
    padding: 20px 0 10px;
    align-items: center;
`;

const OnboardingImage = styled(Image)`
    flex: 1;
    width: 100%;
    height: 100%;
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
