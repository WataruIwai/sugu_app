import React from "react";
import { ImageSourcePropType } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import styled from "styled-components/native";

import { FormLayout } from "../layout/FormLayout";

const googleLogo = require("../../assets/google-g-logo.png") as ImageSourcePropType;

type SignUpPageProps = {
    agreedToTerms: boolean;
    loading: boolean;
    errorMessage: string | null;
    onToggleTerms: () => void;
    onSubmitApple: () => void;
    onSubmitGoogle: () => void;
    onNavigateSignIn: () => void;
    onOpenTerms: () => void;
    onOpenPrivacyPolicy: () => void;
};

export const SignUpPage = ({
    agreedToTerms,
    loading,
    errorMessage,
    onToggleTerms,
    onSubmitApple,
    onSubmitGoogle,
    onNavigateSignIn,
    onOpenTerms,
    onOpenPrivacyPolicy,
}: SignUpPageProps) => {
    return (
        <FormLayout
            title="Apple ID で始める"
            subtitle="アカウント作成後は My List の保存や端末をまたいだ学習の継続ができるようになります。"
        >
            <TopSpacer />

            <AppleButtonWrap>
                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={
                        AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
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

            <GoogleButton
                activeOpacity={0.84}
                disabled={loading}
                $disabled={loading}
                onPress={onSubmitGoogle}
            >
                <GoogleLogo source={googleLogo} resizeMode="contain" />
                <GoogleButtonText>Sign up with Google</GoogleButtonText>
            </GoogleButton>

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
                    <AgreementText>利用規約に同意して続行する</AgreementText>
                    <AgreementIndicator $active={agreedToTerms} />
                </AgreementRow>
            </TermsArea>

            <ErrorSlot>
                <ErrorText $visible={Boolean(errorMessage)} numberOfLines={2}>
                    {errorMessage ?? " "}
                </ErrorText>
            </ErrorSlot>

            <FooterLink disabled={loading} onPress={onNavigateSignIn}>
                <FooterLinkText>ログインへ戻る</FooterLinkText>
            </FooterLink>
        </FormLayout>
    );
};

const TopSpacer = styled.View`
    height: 48px;
`;

const AppleButtonWrap = styled.View`
    width: 100%;
`;

const GoogleButton = styled.TouchableOpacity<{ $disabled: boolean }>`
    width: 100%;
    height: 54px;
    margin-top: 10px;
    border-radius: 16px;
    border-width: 1px;
    border-color: #dadce0;
    background-color: #ffffff;
    opacity: ${(props: { $disabled: boolean }) =>
        props.$disabled ? 0.72 : 1};
    align-items: center;
    justify-content: center;
    flex-direction: row;
`;

const GoogleButtonText = styled.Text`
    color: #202124;
    font-size: 19px;
    font-weight: 600;
    margin-left: 10px;
`;

const GoogleLogo = styled.Image`
    width: 22px;
    height: 22px;
`;

const TermsArea = styled.View`
    align-items: center;
    margin-top: 18px;
    margin-bottom: 26px;
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
    font-size: 15px;
    font-weight: 600;
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

const ErrorSlot = styled.View`
    width: 100%;
    height: 42px;
    justify-content: center;
`;

const ErrorText = styled.Text<{ $visible: boolean }>`
    color: #a93030;
    font-size: 13px;
    line-height: 18px;
    opacity: ${(props: { $visible: boolean }) => (props.$visible ? 1 : 0)};
`;

const FooterLink = styled.TouchableOpacity`
    margin-top: 2px;
    align-self: center;
`;

const FooterLinkText = styled.Text`
    color: #4a4a4a;
    font-size: 14px;
    font-weight: 600;
`;
