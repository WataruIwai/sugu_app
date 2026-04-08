import React from "react";
import styled from "styled-components/native";

import { ScreenLayout } from "../layout/ScreenLayout";
import { WordItem } from "../types";

type WordDetailPageProps = {
  word: WordItem;
  onBack: () => void;
  onLogout: () => void;
};

export const WordDetailPage = ({
  word,
  onBack,
  onLogout,
}: WordDetailPageProps) => {
  return (
    <ScreenLayout>
      <TopRow>
        <BackButton onPress={onBack}>
          <BackButtonText>Back</BackButtonText>
        </BackButton>
        <LogoutButton onPress={onLogout}>
          <LogoutButtonText>Logout</LogoutButtonText>
        </LogoutButton>
      </TopRow>

      <WordTitle>{word.word}</WordTitle>
      <MeaningText>{word.meaning || "meaning"}</MeaningText>

      <Section>
        <SectionLabel>pronunciation</SectionLabel>
        <SectionBody>{word.pronunciation || "No pronunciation registered."}</SectionBody>
      </Section>

      <Section>
        <SectionLabel>memo</SectionLabel>
        <SectionBody>{word.memo || "No memo registered."}</SectionBody>
      </Section>
    </ScreenLayout>
  );
};

const TopRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
`;

const BackButton = styled.TouchableOpacity`
  padding: 8px 12px;
  border-radius: 14px;
  border-width: 1px;
  border-color: #1f1f1f;
`;

const BackButtonText = styled.Text`
  color: #181818;
  font-size: 13px;
  font-weight: 600;
`;

const LogoutButton = styled.TouchableOpacity`
  padding: 8px 12px;
  border-radius: 14px;
  border-width: 1px;
  border-color: #1f1f1f;
`;

const LogoutButtonText = styled.Text`
  color: #181818;
  font-size: 13px;
  font-weight: 600;
`;

const WordTitle = styled.Text`
  font-size: 58px;
  line-height: 64px;
  color: #111111;
  font-weight: 300;
  margin-bottom: 26px;
`;

const MeaningText = styled.Text`
  font-size: 20px;
  line-height: 26px;
  color: #232323;
  margin-bottom: 42px;
`;

const Section = styled.View`
  margin-bottom: 34px;
`;

const SectionLabel = styled.Text`
  font-size: 16px;
  line-height: 20px;
  color: #242424;
  font-weight: 700;
  margin-bottom: 8px;
`;

const SectionBody = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: #2f2f2f;
`;
