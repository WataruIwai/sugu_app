import React from "react";
import styled from "styled-components/native";

type ChromeExtensionNoticeCardProps = {
    onClose: () => void;
    onDismissPermanently: () => void;
};

export const ChromeExtensionNoticeCard = ({
    onClose,
    onDismissPermanently,
}: ChromeExtensionNoticeCardProps) => (
    <NoticeCard>
        <NoticeLabel>お知らせ</NoticeLabel>
        <NoticeTitle>Chrome 拡張が使えるようになりました</NoticeTitle>
        <NoticeMessage>
            PCで英語を読んでいる時も、Suguで単語を検索・保存できます。
            {"\n"}
            保存した単語は、iOS版Suguからも確認できます。
        </NoticeMessage>
        <NoticeActions>
            <SecondaryButton
                activeOpacity={0.84}
                onPress={onClose}
            >
                <SecondaryButtonText>あとで</SecondaryButtonText>
            </SecondaryButton>
            <PrimaryButton
                activeOpacity={0.84}
                onPress={onDismissPermanently}
            >
                <PrimaryButtonText>次回以降表示しない</PrimaryButtonText>
            </PrimaryButton>
        </NoticeActions>
    </NoticeCard>
);

const NoticeCard = styled.View`
    border-radius: 18px;
    border-width: 1px;
    border-color: #e4e4e4;
    background-color: #ffffff;
    padding: 18px 18px 16px;
    margin-bottom: 14px;
    shadow-color: #000000;
    shadow-opacity: 0.06;
    shadow-radius: 12px;
    shadow-offset: 0px 5px;
    elevation: 3;
`;

const NoticeLabel = styled.Text`
    color: #777777;
    font-size: 12px;
    line-height: 16px;
    font-weight: 800;
    margin-bottom: 8px;
`;

const NoticeTitle = styled.Text`
    color: #111111;
    font-size: 20px;
    line-height: 27px;
    font-weight: 900;
    margin-bottom: 10px;
`;

const NoticeMessage = styled.Text`
    color: #555555;
    font-size: 13px;
    line-height: 21px;
    font-weight: 700;
    margin-bottom: 16px;
`;

const NoticeActions = styled.View`
    flex-direction: row;
    align-items: center;
`;

const SecondaryButton = styled.TouchableOpacity`
    flex: 1;
    height: 44px;
    border-radius: 22px;
    border-width: 1px;
    border-color: #d8d8d8;
    background-color: #ffffff;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    padding: 0 12px;
`;

const SecondaryButtonText = styled.Text`
    color: #555555;
    font-size: 14px;
    line-height: 18px;
    font-weight: 800;
`;

const PrimaryButton = styled.TouchableOpacity`
    flex: 1.4;
    height: 44px;
    border-radius: 22px;
    background-color: #111111;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    padding: 0 14px;
`;

const PrimaryButtonText = styled.Text`
    color: #ffffff;
    font-size: 13px;
    line-height: 18px;
    font-weight: 900;
`;
