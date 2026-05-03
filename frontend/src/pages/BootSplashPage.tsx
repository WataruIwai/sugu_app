import React from "react";
import { ImageSourcePropType } from "react-native";
import styled from "styled-components/native";

const bootWordmark = require("../../assets/boot-wordmark.png") as ImageSourcePropType;

export const BootSplashPage = () => {
    return (
        <Container>
            <Wordmark source={bootWordmark} resizeMode="contain" />
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

const Wordmark = styled.Image`
    width: 360px;
    height: 202px;
`;
