import React, { useCallback, useState } from "react";
import { FlatList, ListRenderItem } from "react-native";
import { Feather } from "@expo/vector-icons";
import styled from "styled-components/native";

import { ScreenLayout } from "../layout/ScreenLayout";
import { WordItem } from "../types";

type VocabularyListPageProps = {
    words: WordItem[];
    errorMessage: string | null;
    onPressWord: (wordId: number) => void;
    onDeleteWord: (wordId: number) => void;
    onOpenSearch: () => void;
    onOpenChangeEmail: () => void;
    onOpenChangePassword: () => void;
    onDeleteAccount: () => void;
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
    onOpenChangeEmail,
    onOpenChangePassword,
    onDeleteAccount,
    menuOpen,
    onToggleMenu,
    onLogout,
}: VocabularyListPageProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            scrollable={false}
            fixedTop={
                <FixedMenuRow>
                    <MenuButton
                        activeOpacity={0.8}
                        onPress={onToggleMenu}
                    >
                        <MenuIcon>{menuOpen ? "×" : "≡"}</MenuIcon>
                    </MenuButton>
                </FixedMenuRow>
            }
            fixedOverlay={
                menuOpen ? (
                    <MenuOverlay>
                        <MenuPanel>
                            <PrimaryMenuButton
                                activeOpacity={0.8}
                                onPress={onLogout}
                            >
                                <PrimaryMenuLabel>ログアウト</PrimaryMenuLabel>
                            </PrimaryMenuButton>
                            <PrimaryMenuButton
                                activeOpacity={0.8}
                                onPress={onOpenChangeEmail}
                            >
                                <PrimaryMenuLabel>
                                    メールアドレス変更
                                </PrimaryMenuLabel>
                            </PrimaryMenuButton>
                            <PrimaryMenuButton
                                activeOpacity={0.8}
                                onPress={onOpenChangePassword}
                            >
                                <PrimaryMenuLabel>
                                    パスワード変更
                                </PrimaryMenuLabel>
                            </PrimaryMenuButton>
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
                <WordsList
                    data={words}
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

const FixedMenuRow = styled.View`
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
`;

const MenuButton = styled.TouchableOpacity`
    width: 44px;
    height: 44px;
    align-items: flex-end;
    justify-content: center;
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
    padding: 132px 34px 48px;
    justify-content: flex-start;
`;

const PrimaryMenuButton = styled.TouchableOpacity`
    padding-top: 18px;
    padding-bottom: 18px;
`;

const PrimaryMenuLabel = styled.Text`
    color: #161616;
    font-size: 28px;
    line-height: 34px;
    font-weight: 700;
`;

const DangerMenuButton = styled.TouchableOpacity`
    padding-top: 28px;
`;

const DangerMenuLabel = styled.Text`
    color: #555555;
    font-size: 18px;
    line-height: 24px;
    font-weight: 500;
`;

const ListWrap = styled.View`
    flex: 1;
    margin-bottom: 72;
    border-bottom: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
`;

const WordsList = styled(FlatList<WordItem>)`
    flex: 1;
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
