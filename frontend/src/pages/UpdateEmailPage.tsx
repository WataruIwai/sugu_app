import React from "react";
import styled from "styled-components/native";

import { FormLayout } from "../layout/FormLayout";

type UpdateEmailPageProps = {
  email: string;
  loading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onChangeEmail: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export const UpdateEmailPage = ({
  email,
  loading,
  errorMessage,
  successMessage,
  onChangeEmail,
  onSubmit,
  onBack,
}: UpdateEmailPageProps) => {
  return (
    <FormLayout
      title="メールアドレス変更"
      subtitle="新しいメールアドレスを入力してください"
    >
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

      {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
      {successMessage ? <SuccessText>{successMessage}</SuccessText> : null}

      <PrimaryButton disabled={loading} onPress={onSubmit}>
        <PrimaryButtonText>
          {loading ? "変更中..." : "メールアドレスを変更"}
        </PrimaryButtonText>
      </PrimaryButton>

      <FooterLink disabled={loading} onPress={onBack}>
        <FooterLinkText>戻る</FooterLinkText>
      </FooterLink>
    </FormLayout>
  );
};

const TopSpacer = styled.View`
  height: 36px;
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

const SuccessText = styled.Text`
  color: #2e7d32;
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

const FooterLink = styled.TouchableOpacity`
  margin-top: 18px;
  align-self: center;
`;

const FooterLinkText = styled.Text`
  color: #4a4a4a;
  font-size: 14px;
  font-weight: 600;
`;
