import React from "react";
import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import styled from "styled-components/native";

import { ScreenLayout } from "../layout/ScreenLayout";
import { WORD_DISPLAY_FONT_FAMILY } from "../styles/fonts";
import { WordDetailItem } from "../types";

type WordDetailPageProps = {
  word: WordDetailItem;
  onBack: () => void;
  onOpenSearch: () => void;
};

export const WordDetailPage = ({
  word,
  onBack,
  onOpenSearch,
}: WordDetailPageProps) => {
  const handlePronounceWord = async () => {
    const text = word.word?.trim();

    if (!text) {
      return;
    }

    await Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      pitch: 1,
      rate: 0.9,
      useApplicationAudioSession: false,
      onStart: () => {
        console.log("Speech started:", text);
      },
      onDone: () => {
        console.log("Speech finished:", text);
      },
      onStopped: () => {
        console.log("Speech stopped:", text);
      },
      onError: (error) => {
        console.log("Speech error:", error);
      },
    });
  };

  return (
    <ScreenLayout
      fixedBottom={
        <SearchTriggerButton activeOpacity={0.84} onPress={onOpenSearch}>
          <Feather name="search" size={22} color="#4a4a4a" />
        </SearchTriggerButton>
      }
    >
      <TopRow>
        <BackButton onPress={onBack}>
          <BackIcon>←</BackIcon>
        </BackButton>
      </TopRow>

      <WordTitle>{word.word}</WordTitle>
      <PronunciationButton
        activeOpacity={0.82}
        onPress={handlePronounceWord}
      >
        <Feather name="volume-2" size={20} color="#222222" />
        <PronunciationButtonText>発音を聞く</PronunciationButtonText>
      </PronunciationButton>

      {word.entries.length > 0 ? (
        <Section>
          {word.entries.map((entry, index) => (
            <EntryCard key={`${entry.meaning_en}-${index}`}>
              <EntryMeaning>{entry.meaning_en}</EntryMeaning>
              <EntryJapanese>{entry.meaning_ja}</EntryJapanese>
              <EntryExample>{entry.example}</EntryExample>
            </EntryCard>
          ))}
        </Section>
      ) : (
        <SectionBody>No detail registered.</SectionBody>
      )}
    </ScreenLayout>
  );
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

const WordTitle = styled.Text`
  font-family: ${WORD_DISPLAY_FONT_FAMILY};
  font-size: 62px;
  line-height: 68px;
  color: #111111;
  font-weight: 700;
  margin-bottom: 14px;
`;

const PronunciationButton = styled.TouchableOpacity`
  align-self: flex-start;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 19px;
  background-color: #f3f3f3;
  flex-direction: row;
  align-items: center;
  margin-bottom: 22px;
`;

const PronunciationButtonText = styled.Text`
  margin-left: 8px;
  color: #222222;
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
`;

const Section = styled.View`
  margin-bottom: 24px;
`;

const SectionBody = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: #252525;
  font-weight: 500;
`;

const EntryCard = styled.View`
  margin-bottom: 14px;
`;

const EntryMeaning = styled.Text`
  color: #181818;
  font-size: 15px;
  line-height: 22px;
  font-weight: 700;
  margin-bottom: 2px;
`;

const EntryJapanese = styled.Text`
  color: #3d3d3d;
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 4px;
`;

const EntryExample = styled.Text`
  color: #555555;
  font-size: 13px;
  line-height: 19px;
`;

const SearchTriggerButton = styled.TouchableOpacity`
  align-self: center;
  width: 58px;
  height: 58px;
  border-radius: 29px;
  border-width: 1px;
  border-color: #c8c8c8;
  background-color: #f7f7f7;
  align-items: center;
  justify-content: center;
`;
