import React from "react";
import styled from "styled-components/native";

import { FormLayout } from "../layout/FormLayout";

type SignInPageProps = {
  email: string;
  password: string;
  loading: boolean;
  errorMessage: string | null;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onNavigateSignUp: () => void;
};

export const SignInPage = ({
  email,
  password,
  loading,
  errorMessage,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onNavigateSignUp,
}: SignInPageProps) => {
  return (
    <FormLayout title="Login">
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
          {loading ? "ログイン中..." : "ログイン"}
        </PrimaryButtonText>
      </PrimaryButton>

      <Divider />

      <SecondaryButton disabled={loading} onPress={onNavigateSignUp}>
        <SecondaryButtonText>アカウントを作成</SecondaryButtonText>
      </SecondaryButton>
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
  font-size: 18px;
  font-weight: 700;
`;

const Divider = styled.View`
  width: 100%;
  height: 1px;
  background-color: #6e6e6e;
  margin: 22px 0;
  opacity: 0.5;
`;

const SecondaryButton = styled.TouchableOpacity`
  width: 100%;
  height: 54px;
  border-radius: 18px;
  border-width: 1.5px;
  border-color: #373737;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
`;

const SecondaryButtonText = styled.Text`
  color: #2b2b2b;
  font-size: 17px;
  font-weight: 600;
`;
