import React from "react";
import { LayoutChangeEvent } from "react-native";
import styled from "styled-components/native";

type BootSplashPageProps = {
    onLayout?: (event: LayoutChangeEvent) => void;
};

export const BootSplashPage = ({ onLayout }: BootSplashPageProps) => {
    return (
        <Container onLayout={onLayout}>
            <Wordmark>Sugu</Wordmark>
        </Container>
    );
};

const Container = styled.View`
    flex: 1;
    background-color: #ffffff;
    align-items: center;
    justify-content: center;
    padding: 24px;
`;

const Wordmark = styled.Text`
    color: #1f1f1f;
    font-size: 44px;
    line-height: 56px;
    font-weight: 700;
    text-align: center;
`;
