import React, { PropsWithChildren } from "react";
import { ScrollView } from "react-native";
import styled from "styled-components/native";

type ScreenLayoutProps = PropsWithChildren<{
  centered?: boolean;
}>;

export const ScreenLayout = ({ children, centered }: ScreenLayoutProps) => {
  if (centered) {
    return (
      <CenteredSafeArea>
        <CenteredContainer>{children}</CenteredContainer>
      </CenteredSafeArea>
    );
  }

  return (
    <BaseSafeArea>
      <ScrollWrapper contentContainerStyle={{ paddingBottom: 48 }}>
        <ContentContainer>{children}</ContentContainer>
      </ScrollWrapper>
    </BaseSafeArea>
  );
};

const BaseSafeArea = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

const CenteredSafeArea = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

const ScrollWrapper = styled(ScrollView).attrs({
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
`;

const ContentContainer = styled.View`
  flex: 1;
  padding: 32px 34px 40px;
`;

const CenteredContainer = styled.View`
  flex: 1;
  justify-content: center;
  padding: 32px 34px 40px;
`;
