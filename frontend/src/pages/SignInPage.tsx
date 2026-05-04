import React from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import styled from "styled-components/native";

import { FormLayout } from "../layout/FormLayout";

type SignInPageProps = {
    agreedToTerms: boolean;
    loading: boolean;
    errorMessage: string | null;
    onToggleTerms: () => void;
    onSubmitApple: () => void;
    onUseGuest: () => void;
    onOpenTerms: () => void;
    onOpenPrivacyPolicy: () => void;
};

export const SignInPage = ({
    agreedToTerms,
    loading,
    errorMessage,
    onToggleTerms,
    onSubmitApple,
    onUseGuest,
    onOpenTerms,
    onOpenPrivacyPolicy,
}: SignInPageProps) => {
    return (
        <FormLayout title="Sugu">
            <TopSpacer />

            <TermsArea>
                <PolicyLinksRow>
                    <PolicyLink activeOpacity={0.8} onPress={onOpenPrivacyPolicy}>
                        <PolicyText>プライバシーポリシー</PolicyText>
                    </PolicyLink>
                    <PolicyDivider>・</PolicyDivider>
                    <PolicyLink activeOpacity={0.8} onPress={onOpenTerms}>
                        <PolicyText>利用規約</PolicyText>
                    </PolicyLink>
                </PolicyLinksRow>
                <AgreementRow activeOpacity={0.82} onPress={onToggleTerms}>
                    <AgreementText>利用規約とプライバシーポリシーに同意する</AgreementText>
                    <AgreementIndicator $active={agreedToTerms} />
                </AgreementRow>
            </TermsArea>

            <AppleButtonWrap>
                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={
                        AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                    }
                    buttonStyle={
                        AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                    }
                    cornerRadius={16}
                    style={{
                        width: "100%",
                        height: 54,
                        opacity: loading ? 0.72 : 1,
                    }}
                    onPress={() => {
                        if (!loading) {
                            onSubmitApple();
                        }
                    }}
                />
            </AppleButtonWrap>

            {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

            <Divider />

            <GuestButton disabled={loading} onPress={onUseGuest}>
                <GuestText>ゲストとして利用する</GuestText>
            </GuestButton>
        </FormLayout>
    );
};

const TopSpacer = styled.View`
    height: 48px;
`;

const AppleButtonWrap = styled.View`
    width: 100%;
    margin-top: 8px;
`;

const TermsArea = styled.View`
    align-items: center;
    margin-top: 8px;
    margin-bottom: 12px;
`;

const PolicyLinksRow = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;
`;

const PolicyLink = styled.TouchableOpacity``;

const PolicyText = styled.Text`
    color: #4a4a4a;
    font-size: 15px;
    font-weight: 600;
`;

const PolicyDivider = styled.Text`
    color: #6a6a6a;
    font-size: 15px;
    font-weight: 600;
    margin: 0 8px;
`;

const AgreementRow = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
`;

const AgreementText = styled.Text`
    color: #4a4a4a;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
`;

const AgreementIndicator = styled.View<{ $active: boolean }>`
    width: 14px;
    height: 14px;
    border-radius: 7px;
    margin-left: 8px;
    border-width: 1px;
    border-color: #555555;
    background-color: ${(props: { $active: boolean }) =>
        props.$active ? "#191919" : "#ffffff"};
`;

const ErrorText = styled.Text`
    color: #a93030;
    font-size: 13px;
    line-height: 18px;
    margin-top: 12px;
    margin-bottom: 12px;
`;

const Divider = styled.View`
    width: 100%;
    height: 1px;
    background-color: #6e6e6e;
    margin: 24px 0 28px;
    opacity: 0.8;
`;

const GuestButton = styled.TouchableOpacity`
    margin-top: 8px;
    align-self: center;
`;

const GuestText = styled.Text`
    text-align: center;
    color: #4a4a4a;
    font-size: 15px;
    font-weight: 600;
`;
