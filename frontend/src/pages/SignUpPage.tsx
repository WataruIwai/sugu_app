import React from "react";
import styled from "styled-components/native";

import { FormLayout } from "../layout/FormLayout";

type SignUpPageProps = {
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
  loading: boolean;
  errorMessage: string | null;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onChangeConfirmPassword: (value: string) => void;
  onToggleTerms: () => void;
  onSubmit: () => void;
  onNavigateSignIn: () => void;
  onOpenTerms: () => void;
  onOpenPrivacyPolicy: () => void;
};

export const SignUpPage = ({
  email,
  password,
  confirmPassword,
  agreedToTerms,
  loading,
  errorMessage,
  onChangeEmail,
  onChangePassword,
  onChangeConfirmPassword,
  onToggleTerms,
  onSubmit,
  onNavigateSignIn,
  onOpenTerms,
  onOpenPrivacyPolicy,
}: SignUpPageProps) => {
  return (
    <FormLayout>
      <TopSpacer />

      <Input
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="メールアドレス"
        placeholderTextColor="#8c8c8c"
        value={email}
        onChangeText={onChangeEmail}
      />

      <Input
        secureTextEntry
        placeholder="パスワード"
        placeholderTextColor="#8c8c8c"
        value={password}
        onChangeText={onChangePassword}
      />

      <Input
        secureTextEntry
        placeholder="確認用"
        placeholderTextColor="#8c8c8c"
        value={confirmPassword}
        onChangeText={onChangeConfirmPassword}
      />

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
        <AgreementRow onPress={onToggleTerms}>
          <AgreementText>利用規約に同意する</AgreementText>
          <AgreementIndicator $active={agreedToTerms} />
        </AgreementRow>
      </TermsArea>

      {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

      <PrimaryButton disabled={loading} onPress={onSubmit}>
        <PrimaryButtonText>
          {loading ? "登録中..." : "アカウントを作成"}
        </PrimaryButtonText>
      </PrimaryButton>

      <FooterLink disabled={loading} onPress={onNavigateSignIn}>
        <FooterLinkText>ログインへ戻る</FooterLinkText>
      </FooterLink>
    </FormLayout>
  );
};

const TopSpacer = styled.View`
  height: 96px;
`;

const Input = styled.TextInput`
  width: 100%;
  height: 52px;
  border-width: 1.5px;
  border-color: #373737;
  border-radius: 16px;
  padding: 0 18px;
  margin-bottom: 18px;
  background-color: #ffffff;
  font-size: 15px;
  color: #111111;
`;

const TermsArea = styled.View`
  align-items: center;
  margin-top: 10px;
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

const ErrorText = styled.Text`
  color: #a93030;
  font-size: 13px;
  line-height: 18px;
  margin-bottom: 14px;
`;

const PrimaryButton = styled.TouchableOpacity`
  width: 100%;
  height: 54px;
  border-radius: 16px;
  background-color: #191919;
  align-items: center;
  justify-content: center;
`;

const PrimaryButtonText = styled.Text`
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
`;

const FooterLink = styled.TouchableOpacity`
  margin-top: 18px;
  align-self: center;
`;

const FooterLinkText = styled.Text`
  color: #4a4a4a;
  font-size: 14px;
  font-weight: 600;
`;
