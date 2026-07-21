import React, { useCallback, useMemo, useState } from "react";
import { FlatList, ListRenderItem } from "react-native";
import { Feather } from "@expo/vector-icons";
import styled from "styled-components/native";

import { ScreenLayout } from "../layout/ScreenLayout";
import { WORD_DISPLAY_FONT_FAMILY } from "../styles/fonts";
import { WordItem } from "../types";

type VocabularyListPageProps = {
    words: WordItem[];
    errorMessage: string | null;
    onPressWord: (wordId: number) => void;
    onDeleteWord: (wordId: number) => void;
    onOpenSearch: () => void;
    onOpenTerms: () => void;
    onOpenPrivacyPolicy: () => void;
    onOpenSupport: () => void;
    onOpenPro: () => void;
    onDeleteAccount: () => void;
    isPro: boolean;
    menuOpen: boolean;
    onToggleMenu: () => void;
    onLogout: () => void;
};

export const VocabularyListPage = ({
    words,
    errorMessage,
    onPressWord,
    onDeleteWord,
    onOpenSearch,
    onOpenTerms,
    onOpenPrivacyPolicy,
    onOpenSupport,
    onOpenPro,
    onDeleteAccount,
    isPro,
    menuOpen,
    onToggleMenu,
    onLogout,
}: VocabularyListPageProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [listSearchText, setListSearchText] = useState("");

    const normalizedSearchText = listSearchText.trim().toLowerCase();
    const filteredWords = useMemo(() => {
        if (!normalizedSearchText) {
            return words;
        }

        return words.filter((word) => {
            const searchableValues = [
                word.word,
                word.meaning,
                word.meaningEnglish,
                word.meaningJapanese,
                word.memo,
                word.pronunciation,
            ];

            return searchableValues.some((value) =>
                value?.toLowerCase().includes(normalizedSearchText),
            );
        });
    }, [normalizedSearchText, words]);

    const renderWordItem = useCallback<ListRenderItem<WordItem>>(
        ({ item }) => (
            <WordListItem
                word={item}
                onPressWord={onPressWord}
                onDeleteWord={onDeleteWord}
            />
        ),
        [onDeleteWord, onPressWord],
    );

    const keyExtractor = useCallback((word: WordItem) => String(word.id), []);

    const getItemLayout = useCallback(
        (_data: ArrayLike<WordItem> | null | undefined, index: number) => ({
            length: WORD_ROW_TOTAL_HEIGHT,
            offset: WORD_ROW_TOTAL_HEIGHT * index,
            index,
        }),
        [],
    );

    return (
        <ScreenLayout
            contentFillsViewport
            horizontalPadding={20}
            fixedTopOffset={0}
            scrollable={false}
            fixedTop={
                <FixedMenuRow $hasBadge={isPro}>
                    {isPro ? <ProBadgeText>PRO</ProBadgeText> : null}
                    <MenuButton
                        activeOpacity={0.8}
                        onPress={onToggleMenu}
                    >
                        {menuOpen ? (
                            <MenuIcon>×</MenuIcon>
                        ) : (
                            <Feather
                                name="settings"
                                size={21}
                                color="#191919"
                            />
                        )}
                    </MenuButton>
                </FixedMenuRow>
            }
            fixedOverlay={
                menuOpen ? (
                    <MenuOverlay>
                        <MenuPanel>
                            <ProMenuButton
                                activeOpacity={0.8}
                                onPress={onOpenPro}
                            >
                                <ProMenuLabel>
                                    Sugu Proへアップグレード
                                </ProMenuLabel>
                                <Feather
                                    name="chevron-right"
                                    size={20}
                                    color="#ffffff"
                                />
                            </ProMenuButton>

                            <PrimaryMenuGroup>
                                <PrimaryMenuButton
                                    activeOpacity={0.8}
                                    onPress={onLogout}
                                >
                                    <PrimaryMenuLabel>
                                        ログアウト
                                    </PrimaryMenuLabel>
                                </PrimaryMenuButton>
                                <PrimaryMenuButton
                                    activeOpacity={0.8}
                                    onPress={onOpenSupport}
                                >
                                    <PrimaryMenuLabel>
                                        お問い合わせ
                                    </PrimaryMenuLabel>
                                </PrimaryMenuButton>
                            </PrimaryMenuGroup>

                            <ReferenceMenuGroup>
                                <ReferenceMenuButton
                                    activeOpacity={0.8}
                                    onPress={onOpenPrivacyPolicy}
                                >
                                    <ReferenceMenuLabel>
                                        プライバシーポリシー
                                    </ReferenceMenuLabel>
                                </ReferenceMenuButton>
                                <ReferenceMenuButton
                                    activeOpacity={0.8}
                                    onPress={onOpenTerms}
                                >
                                    <ReferenceMenuLabel>
                                        利用規約
                                    </ReferenceMenuLabel>
                                </ReferenceMenuButton>
                            </ReferenceMenuGroup>

                            <DangerMenuButton
                                activeOpacity={0.8}
                                onPress={() => setShowDeleteConfirm(true)}
                            >
                                <DangerMenuLabel>
                                    アカウント削除
                                </DangerMenuLabel>
                            </DangerMenuButton>
                        </MenuPanel>
                        {showDeleteConfirm ? (
                            <ConfirmOverlay>
                                <ConfirmCard>
                                    <ConfirmTitle>
                                        アカウントを削除しますか？
                                    </ConfirmTitle>
                                    <ConfirmDescription>
                                        アカウントを削除すると、今まで記録した単語や検索履歴などのデータもすべて削除されます。本当に続けますか？
                                    </ConfirmDescription>
                                    <ConfirmActions>
                                        <SecondaryConfirmButton
                                            activeOpacity={0.84}
                                            onPress={() =>
                                                setShowDeleteConfirm(false)
                                            }
                                        >
                                            <SecondaryConfirmText>
                                                キャンセル
                                            </SecondaryConfirmText>
                                        </SecondaryConfirmButton>
                                        <DangerConfirmButton
                                            activeOpacity={0.84}
                                            onPress={() => {
                                                setShowDeleteConfirm(false);
                                                onDeleteAccount();
                                            }}
                                        >
                                            <DangerConfirmText>
                                                削除する
                                            </DangerConfirmText>
                                        </DangerConfirmButton>
                                    </ConfirmActions>
                                </ConfirmCard>
                            </ConfirmOverlay>
                        ) : null}
                    </MenuOverlay>
                ) : null
            }
            fixedBottom={
                <SearchTriggerButton
                    activeOpacity={0.84}
                    onPress={onOpenSearch}
                >
                    <Feather
                        name="search"
                        size={22}
                        color="#4a4a4a"
                    />
                </SearchTriggerButton>
            }
        >
            <ListWrap>
                {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
                <ListSearchTrack>
                    <ListSearchInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="登録した単語を検索"
                        placeholderTextColor="#8f8f8f"
                        returnKeyType="search"
                        value={listSearchText}
                        onChangeText={setListSearchText}
                    />
                    <ListSearchActionButton
                        activeOpacity={0.86}
                        onPress={() => setListSearchText("")}
                    >
                        <ListSearchActionText>
                            {listSearchText ? "×" : "⌕"}
                        </ListSearchActionText>
                    </ListSearchActionButton>
                </ListSearchTrack>
                <WordsList
                    data={filteredWords}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    removeClippedSubviews
                    keyboardShouldPersistTaps="always"
                    ItemSeparatorComponent={WordRowSeparator}
                    initialNumToRender={10}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    updateCellsBatchingPeriod={16}
                    getItemLayout={getItemLayout}
                    renderItem={renderWordItem}
                    ListEmptyComponent={
                        words.length > 0 ? (
                            <EmptyStateText>
                                該当する単語が見つかりませんでした。
                            </EmptyStateText>
                        ) : null
                    }
                />
            </ListWrap>
        </ScreenLayout>
    );
};

const WORD_ROW_HEIGHT = 44;
const WORD_ROW_GAP = 10;
const WORD_ROW_TOTAL_HEIGHT = WORD_ROW_HEIGHT + WORD_ROW_GAP;

const WordListItem = React.memo(
    ({
        word,
        onPressWord,
        onDeleteWord,
    }: {
        word: WordItem;
        onPressWord: (wordId: number) => void;
        onDeleteWord: (wordId: number) => void;
    }) => (
        <WordRow>
            <WordMain onPress={() => onPressWord(word.id)}>
                <WordTitle>{word.word || "Hello"}</WordTitle>
            </WordMain>
            <DeleteButton onPress={() => onDeleteWord(word.id)}>
                <Feather
                    name="trash-2"
                    size={18}
                    color="#d9485f"
                />
            </DeleteButton>
        </WordRow>
    ),
);

const FixedMenuRow = styled.View<{ $hasBadge: boolean }>`
    flex-direction: row;
    justify-content: ${(props) =>
        props.$hasBadge ? "space-between" : "flex-end"};
    align-items: center;
`;

const MenuButton = styled.TouchableOpacity`
    width: 36px;
    height: 36px;
    align-items: flex-end;
    justify-content: center;
`;

const ProBadgeText = styled.Text`
    color: #8a8a8e;
    font-size: 12px;
    line-height: 16px;
    font-weight: 500;
    border-width: 0.5px;
    border-color: #8a8a8e;
    border-radius: 6px;
    padding: 3px 8px;
`;

const MenuIcon = styled.Text`
    font-size: 24px;
    line-height: 24px;
    color: #191919;
    font-weight: 700;
`;

const MenuOverlay = styled.View`
    flex: 1;
    background-color: #ffffff;
`;

const MenuPanel = styled.View`
    flex: 1;
    padding: 180px 34px 48px;
    justify-content: flex-start;
`;

const ProMenuButton = styled.TouchableOpacity`
    min-height: 56px;
    border-radius: 16px;
    background-color: #111111;
    padding: 16px 18px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
`;

const ProMenuLabel = styled.Text`
    flex: 1;
    color: #ffffff;
    font-family: ${WORD_DISPLAY_FONT_FAMILY};
    font-size: 17px;
    line-height: 22px;
    font-weight: 700;
    margin-right: 12px;
`;

const PrimaryMenuGroup = styled.View`
    margin-bottom: 20px;
`;

const PrimaryMenuButton = styled.TouchableOpacity`
    padding-top: 15px;
    padding-bottom: 15px;
    border-bottom-width: 0.5px;
    border-bottom-color: #e5e5e5;
`;

const PrimaryMenuLabel = styled.Text`
    color: #111111;
    font-size: 15px;
    line-height: 21px;
    font-weight: 700;
`;

const ReferenceMenuGroup = styled.View`
    margin-bottom: 40px;
`;

const ReferenceMenuButton = styled.TouchableOpacity`
    padding-top: 11px;
    padding-bottom: 11px;
`;

const ReferenceMenuLabel = styled.Text`
    color: #8a8a8e;
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
`;

const DangerMenuButton = styled.TouchableOpacity`
    padding-top: 0px;
`;

const DangerMenuLabel = styled.Text`
    color: #555555;
    font-size: 18px;
    line-height: 24px;
    font-weight: 500;
`;

const ListWrap = styled.View`
    flex: 1;
    margin-bottom: 72px;
`;

const WordsList = styled(FlatList<WordItem>)`
    flex: 1;
`;

const ListSearchTrack = styled.View`
    height: 58px;
    border-radius: 29px;
    border-width: 1px;
    border-color: #c8c8c8;
    background-color: #f7f7f7;
    padding: 8px 10px 8px 18px;
    flex-direction: row;
    align-items: center;
    margin-bottom: 18px;
`;

const ListSearchInput = styled.TextInput`
    flex: 1;
    height: 100%;
    color: #444444;
    font-size: 14px;
    padding-right: 14px;
`;

const ListSearchActionButton = styled.TouchableOpacity`
    width: 38px;
    height: 38px;
    align-items: center;
    justify-content: center;
`;

const ListSearchActionText = styled.Text`
    color: #444444;
    font-size: 18px;
    line-height: 20px;
    font-weight: 700;
`;

const WordRowSeparator = styled.View`
    height: 10px;
`;

const ErrorText = styled.Text`
    color: #a93030;
    font-size: 13px;
    line-height: 18px;
    margin-bottom: 18px;
`;

const EmptyStateText = styled.Text`
    color: #6a6a6a;
    font-size: 14px;
    line-height: 20px;
    text-align: center;
    margin-top: 18px;
`;

const WordRow = styled.View`
    height: 44px;
    flex-direction: row;
    align-items: center;
    padding-left: 14px;
    padding-right: 13px;
    border-width: 1px;
    border-color: #f1f1f1;
    border-radius: 14px;
    background-color: #ffffff;
    shadow-radius: 8px;
    shadow-offset: 0px 2px;
    elevation: 2;
`;

const WordMain = styled.TouchableOpacity`
    flex: 1;
`;

const WordTitle = styled.Text`
    font-family: ${WORD_DISPLAY_FONT_FAMILY};
    font-size: 18px;
    line-height: 22px;
    color: #202020;
    font-weight: 700;
`;

const DeleteButton = styled.TouchableOpacity`
    width: 22px;
    height: 22px;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
`;

const SearchTriggerButton = styled.TouchableOpacity`
    align-self: center;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background-color: #ffffff;
    align-items: center;
    justify-content: center;
    shadow-color: #000000;
    shadow-opacity: 0.1;
    shadow-radius: 14px;
    shadow-offset: 0px 6px;
    elevation: 6;
`;

const ConfirmOverlay = styled.View`
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    background-color: rgba(0, 0, 0, 0.16);
    align-items: center;
    justify-content: center;
    padding: 0 24px;
`;

const ConfirmCard = styled.View`
    width: 100%;
    max-width: 360px;
    border-radius: 24px;
    background-color: #ffffff;
    padding: 24px 22px 20px;
`;

const ConfirmTitle = styled.Text`
    color: #161616;
    font-size: 22px;
    line-height: 28px;
    font-weight: 700;
    margin-bottom: 12px;
`;

const ConfirmDescription = styled.Text`
    color: #555555;
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 20px;
`;

const ConfirmActions = styled.View`
    flex-direction: row;
    justify-content: flex-end;
`;

const SecondaryConfirmButton = styled.TouchableOpacity`
    min-width: 108px;
    height: 44px;
    border-radius: 14px;
    border-width: 1px;
    border-color: #cfcfcf;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    padding: 0 16px;
`;

const SecondaryConfirmText = styled.Text`
    color: #2f2f2f;
    font-size: 15px;
    font-weight: 600;
`;

const DangerConfirmButton = styled.TouchableOpacity`
    min-width: 108px;
    height: 44px;
    border-radius: 14px;
    background-color: #1f1f1f;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
`;

const DangerConfirmText = styled.Text`
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
`;
