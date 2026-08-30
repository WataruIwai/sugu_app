import React from "react";
import { ImageSourcePropType } from "react-native";
import { Feather } from "@expo/vector-icons";
import styled from "styled-components/native";

const cardWhiteIcon = require("../../assets/card_white.png");
const cardSelectedIcon = require("../../assets/card_selected.png");

export type BottomNavigationTab = "home" | "search" | "cards";

type BottomNavigationProps = {
    activeTab: BottomNavigationTab;
    onOpenHome: () => void;
    onOpenSearch: () => void;
    onOpenCards: () => void;
};

export const BottomNavigation = ({
    activeTab,
    onOpenHome,
    onOpenSearch,
    onOpenCards,
}: BottomNavigationProps) => (
    <NavigationTrack>
        <NavigationButton
            activeOpacity={0.84}
            $active={activeTab === "home"}
            onPress={onOpenHome}
        >
            <Feather
                name="list"
                size={24}
                color={activeTab === "home" ? "#1f1f1f" : "#ffffff"}
            />
        </NavigationButton>
        <NavigationButton
            activeOpacity={0.84}
            $active={activeTab === "search"}
            onPress={onOpenSearch}
        >
            <Feather
                name="search"
                size={25}
                color={activeTab === "search" ? "#1f1f1f" : "#ffffff"}
            />
        </NavigationButton>
        <NavigationButton
            activeOpacity={0.84}
            $active={activeTab === "cards"}
            onPress={onOpenCards}
        >
            <CardIcon
                source={
                    (activeTab === "cards"
                        ? cardSelectedIcon
                        : cardWhiteIcon) as ImageSourcePropType
                }
            />
        </NavigationButton>
    </NavigationTrack>
);

const NavigationTrack = styled.View`
    height: 68px;
    border-radius: 34px;
    background-color: #262222;
    padding: 7px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`;

const NavigationButton = styled.TouchableOpacity<{ $active: boolean }>`
    width: 102px;
    height: 54px;
    border-radius: 27px;
    align-items: center;
    justify-content: center;
    background-color: ${(props: { $active: boolean }) =>
        props.$active ? "#ffffff" : "transparent"};
`;

const CardIcon = styled.Image`
    width: 31px;
    height: 30px;
`;
