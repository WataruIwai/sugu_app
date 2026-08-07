import React from "react";
import styled from "styled-components/native";

type ChromeExtensionNoticeProps = {
    onCloseLater: () => void;
    onDismiss: () => void;
    variant?: "modal" | "inline";
};

export const ChromeExtensionNotice = ({
    onCloseLater,
    onDismiss,
    variant = "modal",
}: ChromeExtensionNoticeProps) => {
    const noticeCard = (
        <NoticeCard $inline={variant === "inline"}>
            <NoticeLabel>お知らせ</NoticeLabel>
            <NoticeTitle>Chrome拡張が使えるようになりました</NoticeTitle>
            <NoticeText>
                PCで英語を読んでいる時も、Suguで単語を検索・保存できます。保存した単語はiOS版Suguにも同期されます。
            </NoticeText>
            <NoticeActions>
                <LaterButton activeOpacity={0.82} onPress={onCloseLater}>
                    <LaterText>あとで</LaterText>
                </LaterButton>
                <DismissButton activeOpacity={0.86} onPress={onDismiss}>
                    <DismissText>次回以降表示しない</DismissText>
                </DismissButton>
            </NoticeActions>
        </NoticeCard>
    );

    if (variant === "inline") {
        return noticeCard;
    }

    return (
        <NoticeOverlay>
            {noticeCard}
        </NoticeOverlay>
    );
};

const NoticeOverlay = styled.View`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 100;
    elevation: 100;
    background-color: rgba(0, 0, 0, 0.42);
    align-items: center;
    justify-content: center;
    padding: 24px;
`;

const NoticeCard = styled.View<{ $inline: boolean }>`
    width: 100%;
    max-width: ${({ $inline }: { $inline: boolean }) =>
        $inline ? "100%" : "680px"};
    border-radius: 24px;
    border-width: 1px;
    border-color: #e2e2e2;
    background-color: #ffffff;
    padding: 20px;
    margin-bottom: ${({ $inline }: { $inline: boolean }) =>
        $inline ? "18px" : "0px"};
`;

const NoticeLabel = styled.Text`
    color: #777777;
    font-size: 13px;
    line-height: 18px;
    font-weight: 800;
    margin-bottom: 8px;
`;

const NoticeTitle = styled.Text`
    color: #111111;
    font-size: 20px;
    line-height: 28px;
    font-weight: 800;
`;

const NoticeText = styled.Text`
    margin-top: 10px;
    color: #4a4a4a;
    font-size: 14px;
    line-height: 22px;
    font-weight: 600;
`;

const NoticeActions = styled.View`
    margin-top: 16px;
    flex-direction: row;
`;

const LaterButton = styled.TouchableOpacity`
    flex: 1;
    height: 44px;
    border-radius: 22px;
    border-width: 1px;
    border-color: #d2d2d2;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
`;

const LaterText = styled.Text`
    color: #555555;
    font-size: 14px;
    font-weight: 800;
`;

const DismissButton = styled.TouchableOpacity`
    flex: 1.4;
    height: 44px;
    border-radius: 22px;
    background-color: #111111;
    align-items: center;
    justify-content: center;
`;

const DismissText = styled.Text`
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
`;
