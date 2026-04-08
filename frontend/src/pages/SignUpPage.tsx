import React from "react";
import styled from "styled-components/native";

import { FormLayout } from "../layout/FormLayout";

type SignUpPageProps = {
  email: string;
  password: string;
  loading: boolean;
  errorMessage: string | null;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onNavigateSignIn: () => void;
};

export const SignUpPage = ({
  email,
  password,
  loading,
  errorMessage,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onNavigateSignIn,
}: SignUpPageProps) => {
  return (
    <FormLayout title="Register" subtitle="アカウントを作成して単語帳を始めましょう。">
      <FieldLabel>メールアドレス</FieldLabel>
      <Input
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="メールアドレス"
        placeholderTextColor="#8c8c8c"
        value={email}
        onChangeText={onChangeEmail}
      />

      <FieldLabel>パスワード</FieldLabel>
      <Input
        secureTextEntry
        placeholder="パスワード"
        placeholderTextColor="#8c8c8c"
        value={password}
        onChangeText={onChangePassword}
      />

      {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

      <PrimaryButton disabled={loading} onPress={onSubmit}>
        <PrimaryButtonText>
          {loading ? "登録中..." : "アカウントを作成"}
        </PrimaryButtonText>
      </PrimaryButton>

      <FooterRow>
        <FooterText>すでにアカウントをお持ちですか？</FooterText>
        <FooterLink disabled={loading} onPress={onNavigateSignIn}>
          <FooterLinkText>ログイン</FooterLinkText>
        </FooterLink>
      </FooterRow>
    </FormLayout>
  );
};

const FieldLabel = styled.Text`
  font-size: 14px;
  color: #3c3c3c;
  margin-bottom: 10px;
`;

const Input = styled.TextInput`
  width: 100%;
  height: 56px;
  border-width: 1.5px;
  border-color: #373737;
  border-radius: 18px;
  padding: 0 18px;
  margin-bottom: 16px;
  background-color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  color: #111111;
`;

const ErrorText = styled.Text`
  color: #a93030;
  font-size: 13px;
  line-height: 18px;
  margin-bottom: 14px;
`;

const PrimaryButton = styled.TouchableOpacity`
  width: 100%;
  height: 56px;
  border-radius: 18px;
  background-color: #191919;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
`;

const PrimaryButtonText = styled.Text`
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
`;

const FooterRow = styled.View`
  margin-top: 20px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const FooterText = styled.Text`
  color: #4a4a4a;
  font-size: 13px;
`;

const FooterLink = styled.TouchableOpacity`
  margin-left: 8px;
`;

const FooterLinkText = styled.Text`
  color: #171717;
  font-size: 13px;
  font-weight: 700;
  text-decoration-line: underline;
`;
