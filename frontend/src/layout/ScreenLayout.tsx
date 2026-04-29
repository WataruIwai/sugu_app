import React, { PropsWithChildren, useState } from "react";
import { LayoutChangeEvent, ScrollView } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import styled from "styled-components/native";

type ScreenLayoutProps = PropsWithChildren<{
    centered?: boolean;
    fixedTop?: React.ReactNode;
    fixedBottom?: React.ReactNode;
    fixedOverlay?: React.ReactNode;
    contentFillsViewport?: boolean;
    lockScrollWhenContentFits?: boolean;
    scrollable?: boolean;
}>;

export const ScreenLayout = ({
    children,
    centered,
    fixedTop,
    fixedBottom,
    fixedOverlay,
    contentFillsViewport = true,
    lockScrollWhenContentFits = false,
    scrollable = true,
}: ScreenLayoutProps) => {
    const insets = useSafeAreaInsets();
    const [viewportHeight, setViewportHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);

    if (centered) {
        return (
            <CenteredSafeArea>
                <CenteredContainer>{children}</CenteredContainer>
            </CenteredSafeArea>
        );
    }

    if (!scrollable) {
        return (
            <BaseSafeArea>
                <ContentContainer $fillViewport={contentFillsViewport}>
                    {children}
                </ContentContainer>
                {fixedTop ? <FixedTopWrap>{fixedTop}</FixedTopWrap> : null}
                {fixedOverlay ? (
                    <FixedOverlayWrap
                        style={{
                            top: -insets.top,
                            bottom: -insets.bottom,
                        }}
                    >
                        {fixedOverlay}
                    </FixedOverlayWrap>
                ) : null}
                {fixedBottom ? (
                    <FixedBottomWrap>{fixedBottom}</FixedBottomWrap>
                ) : null}
            </BaseSafeArea>
        );
    }

    const canScroll =
        !lockScrollWhenContentFits || contentHeight > viewportHeight + 1;

    const handleLayout = (event: LayoutChangeEvent) => {
        setViewportHeight(event.nativeEvent.layout.height);
    };

    return (
        <BaseSafeArea>
            <ScrollWrapper
                contentContainerStyle={{ flexGrow: 1 }}
                onContentSizeChange={(_width: number, height: number) =>
                    setContentHeight(height)
                }
                onLayout={handleLayout}
                scrollEnabled={canScroll}
            >
                <ContentContainer $fillViewport={contentFillsViewport}>
                    {children}
                </ContentContainer>
            </ScrollWrapper>
            {fixedTop ? <FixedTopWrap>{fixedTop}</FixedTopWrap> : null}
            {fixedOverlay ? (
                <FixedOverlayWrap
                    style={{
                        top: -insets.top,
                        bottom: -insets.bottom,
                    }}
                >
                    {fixedOverlay}
                </FixedOverlayWrap>
            ) : null}
            {fixedBottom ? (
                <FixedBottomWrap>{fixedBottom}</FixedBottomWrap>
            ) : null}
        </BaseSafeArea>
    );
};

const BaseSafeArea = styled(SafeAreaView)`
    flex: 1;
    background-color: #ffffff;
`;

const CenteredSafeArea = styled(SafeAreaView)`
    flex: 1;
    background-color: #ffffff;
`;

const ScrollWrapper = styled(ScrollView).attrs({
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "always",
    bounces: false,
    alwaysBounceVertical: false,
    overScrollMode: "never",
})`
    flex: 1;
`;

const ContentContainer = styled.View<{ $fillViewport: boolean }>`
    ${(props: { $fillViewport: boolean }) =>
        props.$fillViewport ? "flex: 1;" : ""}
    padding: 0px 34px;
    margin-top: 56px;
`;

const CenteredContainer = styled.View`
    flex: 1;
    justify-content: center;
    padding: 32px 34px 40px;
`;

const FixedBottomWrap = styled.View`
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 34px;
`;

const FixedTopWrap = styled.View`
    position: absolute;
    top: 40px;
    left: 34px;
    right: 34px;
    z-index: 30;
`;

const FixedOverlayWrap = styled.View`
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    z-index: 20;
`;
