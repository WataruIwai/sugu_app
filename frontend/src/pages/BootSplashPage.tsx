import React from "react";
import { ImageSourcePropType } from "react-native";
import styled from "styled-components/native";

const appLogo = require("../../assets/app-logo.png") as ImageSourcePropType;

export const BootSplashPage = () => {
    return (
        <Container>
            <Logo source={appLogo} resizeMode="contain" />
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

const Logo = styled.Image`
    width: 220px;
    height: 220px;
`;
