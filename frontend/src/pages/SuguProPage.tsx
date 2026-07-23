import React from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import styled from "styled-components/native";

import { ScreenLayout } from "../layout/ScreenLayout";
import type { SubscriptionPurchaseState } from "../subscription/subscriptionService";

type SuguProPageProps = {
    onBack: () => void;
    onPurchase: () => void;
    onRestore: () => void;
    productPrice: string | null;
    isLoadingProduct: boolean;
    isPurchasing: boolean;
    isRestoring: boolean;
    isActive: boolean;
    errorMessage: string | null;
    purchaseState: SubscriptionPurchaseState;
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
    productPrice,
    isLoadingProduct,
    isPurchasing,
    isRestoring,
    isActive,
    errorMessage,
    purchaseState,
}: SuguProPageProps) => {
    const isProcessingPurchase =
        isPurchasing ||
        purchaseState === "purchasing" ||
        purchaseState === "verifying";
    const statusMessage =
        isActive || isProcessingPurchase || isRestoring
            ? ""
            : getPurchaseStateMessage(purchaseState);
    const purchaseButtonDisabled =
        isActive || isLoadingProduct || isPurchasing || isRestoring;

    return (
        <ScreenLayout
            scrollable={false}
            fixedOverlay={
                isProcessingPurchase ? (
                    <PurchaseBlockingOverlay>
                        <PurchaseBlockingCard>
                            <ActivityIndicator
                                size="small"
                                color="#ffffff"
                            />
                            <PurchaseBlockingText>
                                {purchaseState === "verifying"
                                    ? "購入を確認中..."
                                    : "購入処理中..."}
                            </PurchaseBlockingText>
                        </PurchaseBlockingCard>
                    </PurchaseBlockingOverlay>
                ) : null
            }
        >
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
                {isLoadingProduct ? (
                    <PricePlaceholder>価格を取得中...</PricePlaceholder>
                ) : productPrice ? (
                    <PriceRow>
                        <ProductPrice>{productPrice}</ProductPrice>
                        <ProductBillingCycle>月額・自動更新</ProductBillingCycle>
                    </PriceRow>
                ) : (
                    <PricePlaceholder>価格を取得できませんでした</PricePlaceholder>
                )}
            </PriceArea>

            {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
            <StatusText>{statusMessage}</StatusText>

            <PrimaryButton
                activeOpacity={0.88}
                onPress={onPurchase}
                disabled={purchaseButtonDisabled}
                $disabled={purchaseButtonDisabled}
            >
                <PrimaryButtonText>
                    {isActive
                        ? "Sugu Pro 利用中"
                        : "Sugu Proを始める"}
                </PrimaryButtonText>
            </PrimaryButton>

            {!isActive ? (
                <SecondaryButton
                    activeOpacity={0.84}
                    onPress={onRestore}
                    disabled={isPurchasing || isRestoring}
                    $disabled={isPurchasing || isRestoring}
                >
                    <SecondaryButtonText>
                        {isRestoring ? "復元中..." : "購入を復元"}
                    </SecondaryButtonText>
                </SecondaryButton>
            ) : null}
        </ScreenLayout>
    );
};

const getPurchaseStateMessage = (state: SubscriptionPurchaseState) => {
    switch (state) {
        case "success":
            return "";
        case "cancelled":
            return "購入をキャンセルしました。";
        case "pending":
            return "購入が保留中です。";
        case "restored":
            return "購入を復元しました。";
        case "noPurchase":
            return "復元できる購入が見つかりませんでした。";
        default:
            return "";
    }
};

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

const PriceRow = styled.View`
    width: 100%;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
`;

const ProductPrice = styled.Text`
    color: #111111;
    font-size: 26px;
    line-height: 32px;
    font-weight: 800;
`;

const ProductBillingCycle = styled.Text`
    color: #8a8a8e;
    font-size: 13px;
    line-height: 18px;
    font-weight: 400;
`;

const ErrorText = styled.Text`
    color: #c03221;
    font-size: 13px;
    line-height: 19px;
    font-weight: 700;
    margin-bottom: 12px;
`;

const StatusText = styled.Text`
    min-height: 20px;
    color: #555555;
    font-size: 13px;
    line-height: 19px;
    font-weight: 700;
    margin-bottom: 10px;
`;

const PrimaryButton = styled.TouchableOpacity<{ $disabled?: boolean }>`
    height: 54px;
    border-radius: 27px;
    background-color: ${({ $disabled }) => ($disabled ? "#8d8d8d" : "#1f1f1f")};
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

const SecondaryButton = styled.TouchableOpacity<{ $disabled?: boolean }>`
    height: 54px;
    border-radius: 27px;
    border-width: 1px;
    border-color: #cfcfcf;
    background-color: ${({ $disabled }) => ($disabled ? "#f2f2f2" : "#ffffff")};
    align-items: center;
    justify-content: center;
`;

const SecondaryButtonText = styled.Text`
    color: #222222;
    font-size: 16px;
    line-height: 22px;
    font-weight: 700;
`;

const PurchaseBlockingOverlay = styled.View`
    flex: 1;
    background-color: rgba(0, 0, 0, 0.34);
    align-items: center;
    justify-content: center;
    padding: 0 34px;
`;

const PurchaseBlockingCard = styled.View`
    min-width: 168px;
    min-height: 92px;
    border-radius: 22px;
    background-color: rgba(17, 17, 17, 0.88);
    align-items: center;
    justify-content: center;
    padding: 20px 22px;
`;

const PurchaseBlockingText = styled.Text`
    color: #ffffff;
    font-size: 14px;
    line-height: 20px;
    font-weight: 800;
    margin-top: 12px;
`;
