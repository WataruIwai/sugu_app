import React from "react";
import styled from "styled-components/native";

import { ScreenLayout } from "../layout/ScreenLayout";
import { WordItem } from "../types";

type VocabularyListPageProps = {
  words: WordItem[];
  loading: boolean;
  errorMessage: string | null;
  onPressWord: (wordId: number) => void;
  onRefresh: () => void;
  onLogout: () => void;
};

export const VocabularyListPage = ({
  words,
  loading,
  errorMessage,
  onPressWord,
  onRefresh,
  onLogout,
}: VocabularyListPageProps) => {
  return (
    <ScreenLayout>
      <TopRow>
        <TopTitle>Vocabulary</TopTitle>
        <TopButton onPress={onLogout}>
          <TopButtonText>Logout</TopButtonText>
        </TopButton>
      </TopRow>

      <RefreshButton disabled={loading} onPress={onRefresh}>
        <RefreshButtonText>{loading ? "Loading..." : "Refresh"}</RefreshButtonText>
      </RefreshButton>

      {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

      {words.map((word) => (
        <WordCard key={word.id} onPress={() => onPressWord(word.id)}>
          <WordTitle>{word.word || "Untitled"}</WordTitle>
          <MeaningText>{word.meaning || "meaning"}</MeaningText>
          <MemoPreview numberOfLines={1}>
            {word.memo || "No memo has been added yet."}
          </MemoPreview>
        </WordCard>
      ))}
    </ScreenLayout>
  );
};

const TopRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const TopTitle = styled.Text`
  font-size: 30px;
  line-height: 34px;
  color: #151515;
  font-weight: 700;
`;

const TopButton = styled.TouchableOpacity`
  padding: 10px 14px;
  border-radius: 16px;
  border-width: 1px;
  border-color: #222222;
`;

const TopButtonText = styled.Text`
  color: #171717;
  font-size: 13px;
  font-weight: 600;
`;

const RefreshButton = styled.TouchableOpacity`
  align-self: flex-start;
  padding: 12px 16px;
  border-radius: 18px;
  background-color: #1b1b1b;
  margin-bottom: 20px;
`;

const RefreshButtonText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
`;

const ErrorText = styled.Text`
  color: #a93030;
  font-size: 13px;
  line-height: 18px;
  margin-bottom: 16px;
`;

const WordCard = styled.TouchableOpacity`
  padding: 8px 2px 18px;
  margin-bottom: 14px;
`;

const WordTitle = styled.Text`
  font-size: 24px;
  line-height: 30px;
  color: #141414;
  font-weight: 700;
  margin-bottom: 6px;
`;

const MeaningText = styled.Text`
  font-size: 16px;
  line-height: 22px;
  color: #3b3b3b;
  margin-bottom: 8px;
`;

const MemoPreview = styled.Text`
  font-size: 15px;
  line-height: 21px;
  color: #2f2f2f;
`;
