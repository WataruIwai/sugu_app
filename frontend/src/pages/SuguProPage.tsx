import React from "react";
import { Feather } from "@expo/vector-icons";
import styled from "styled-components/native";

import { ScreenLayout } from "../layout/ScreenLayout";

type SuguProPageProps = {
    onBack: () => void;
    onPurchase: () => void;
    onRestore: () => void;
};

const PRO_FEATURES = [
    "広告なし",
    "検索回数無制限",
    "今後追加されるPro限定機能",
];

export const SuguProPage = ({
    onBack,
    onPurchase,
    onRestore,
}: SuguProPageProps) => (
    <ScreenLayout>
        <TopRow>
            <BackButton
                activeOpacity={0.82}
                onPress={onBack}
            >
                <BackIcon>←</BackIcon>
            </BackButton>
        </TopRow>

        <Title>Sugu Pro</Title>

        <FeatureList>
            {PRO_FEATURES.map((feature) => (
                <FeatureRow key={feature}>
                    <FeatureIconWrap>
                        <Feather
                            name="check"
                            size={16}
                            color="#111111"
                        />
                    </FeatureIconWrap>
                    <FeatureText>{feature}</FeatureText>
                </FeatureRow>
            ))}
        </FeatureList>

        <PriceArea>
            <PricePlaceholder>価格表示エリア</PricePlaceholder>
        </PriceArea>

        <PrimaryButton
            activeOpacity={0.88}
            onPress={onPurchase}
        >
            <PrimaryButtonText>Sugu Proを始める</PrimaryButtonText>
        </PrimaryButton>

        <SecondaryButton
            activeOpacity={0.84}
            onPress={onRestore}
        >
            <SecondaryButtonText>購入を復元</SecondaryButtonText>
        </SecondaryButton>
    </ScreenLayout>
);

const TopRow = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 34px;
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

const Title = styled.Text`
    color: #111111;
    font-size: 44px;
    line-height: 50px;
    font-weight: 800;
    margin-bottom: 32px;
`;

const FeatureList = styled.View`
    margin-bottom: 28px;
`;

const FeatureRow = styled.View`
    min-height: 44px;
    flex-direction: row;
    align-items: center;
    margin-bottom: 12px;
`;

const FeatureIconWrap = styled.View`
    width: 30px;
    height: 30px;
    border-radius: 15px;
    background-color: #f2f2f2;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
`;

const FeatureText = styled.Text`
    flex: 1;
    color: #191919;
    font-size: 17px;
    line-height: 24px;
    font-weight: 700;
`;

const PriceArea = styled.View`
    min-height: 78px;
    border-radius: 18px;
    border-width: 1px;
    border-color: #d7d7d7;
    background-color: #f8f8f8;
    align-items: center;
    justify-content: center;
    margin-bottom: 22px;
    padding: 18px;
`;

const PricePlaceholder = styled.Text`
    color: #6f6f6f;
    font-size: 15px;
    line-height: 22px;
    font-weight: 700;
`;

const PrimaryButton = styled.TouchableOpacity`
    height: 54px;
    border-radius: 27px;
    background-color: #1f1f1f;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
`;

const PrimaryButtonText = styled.Text`
    color: #ffffff;
    font-size: 16px;
    line-height: 22px;
    font-weight: 800;
`;

const SecondaryButton = styled.TouchableOpacity`
    height: 54px;
    border-radius: 27px;
    border-width: 1px;
    border-color: #cfcfcf;
    background-color: #ffffff;
    align-items: center;
    justify-content: center;
`;

const SecondaryButtonText = styled.Text`
    color: #222222;
    font-size: 16px;
    line-height: 22px;
    font-weight: 700;
`;
