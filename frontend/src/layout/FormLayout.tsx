import React, { PropsWithChildren } from "react";
import styled from "styled-components/native";

import { ScreenLayout } from "./ScreenLayout";

type FormLayoutProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

export const FormLayout = ({
  title,
  subtitle,
  children,
}: FormLayoutProps) => {
  return (
    <ScreenLayout centered>
      <Content>
        {title ? <Title>{title}</Title> : null}
        {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
        {children}
      </Content>
    </ScreenLayout>
  );
};

const Content = styled.View`
  width: 100%;
  padding: 8px 0;
`;

const Title = styled.Text`
  font-size: 34px;
  line-height: 40px;
  font-weight: 700;
  color: #171717;
  margin-bottom: 12px;
`;

const Subtitle = styled.Text`
  font-size: 15px;
  line-height: 22px;
  color: #4d4d4d;
  margin-bottom: 28px;
`;
