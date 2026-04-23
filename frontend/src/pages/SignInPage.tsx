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
  onUseGuest: () => void;
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
  onUseGuest,
}: SignInPageProps) => {
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

      <GuestButton disabled={loading} onPress={onUseGuest}>
        <GuestText>ゲストとして利用する</GuestText>
      </GuestButton>
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
  margin-bottom: 20px;
  background-color: #ffffff;
  font-size: 15px;
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
  height: 52px;
  border-radius: 16px;
  background-color: #191919;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
`;

const PrimaryButtonText = styled.Text`
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
`;

const Divider = styled.View`
  width: 100%;
  height: 1px;
  background-color: #6e6e6e;
  margin: 24px 0 34px;
  opacity: 0.8;
`;

const SecondaryButton = styled.TouchableOpacity`
  width: 100%;
  height: 52px;
  border-radius: 16px;
  border-width: 1.5px;
  border-color: #373737;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
`;

const SecondaryButtonText = styled.Text`
  color: #2b2b2b;
  font-size: 16px;
  font-weight: 600;
`;

const GuestButton = styled.TouchableOpacity`
  margin-top: 28px;
  align-self: center;
`;

const GuestText = styled.Text`
  text-align: center;
  color: #4a4a4a;
  font-size: 15px;
  font-weight: 600;
`;
