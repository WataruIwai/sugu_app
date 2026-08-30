import React, { useCallback, useMemo, useState } from "react";
import { FlatList, ListRenderItem } from "react-native";
import { Feather } from "@expo/vector-icons";
import styled from "styled-components/native";

import { BottomNavigation } from "../components/BottomNavigation";
import { ChromeExtensionNoticeCard } from "../components/ChromeExtensionNoticeCard";
import { ScreenLayout } from "../layout/ScreenLayout";
import { WORD_DISPLAY_FONT_FAMILY } from "../styles/fonts";
import { WordItem } from "../types";

export type NoticeItem = {
    id: string;
    title: string;
    url: string;
};

type VocabularyListPageProps = {
    words: WordItem[];
    errorMessage: string | null;
    notices: NoticeItem[];
    onPressWord: (wordId: number) => void;
    onDeleteWord: (wordId: number) => void;
    onAddWordToWidget: (word: WordItem) => void;
    onOpenSearch: () => void;
    onOpenCards: () => void;
    onOpenTerms: () => void;
    onOpenPrivacyPolicy: () => void;
    onOpenSupport: () => void;
    onOpenPro: () => void;
    onDeleteAccount: () => void;
    isPro: boolean;
    menuOpen: boolean;
    onToggleMenu: () => void;
    onLogout: () => void;
    onOpenNotice: (notice: NoticeItem) => void;
    chromeExtensionNoticeVisible: boolean;
    onCloseChromeExtensionNotice: () => void;
    onDismissChromeExtensionNoticePermanently: () => void;
};

export const VocabularyListPage = ({
    words,
    errorMessage,
    notices,
    onPressWord,
    onDeleteWord,
    onAddWordToWidget,
    onOpenSearch,
    onOpenCards,
    onOpenTerms,
    onOpenPrivacyPolicy,
    onOpenSupport,
    onOpenPro,
    onDeleteAccount,
    isPro,
    menuOpen,
    onToggleMenu,
    onLogout,
    onOpenNotice,
    chromeExtensionNoticeVisible,
    onCloseChromeExtensionNotice,
    onDismissChromeExtensionNoticePermanently,
}: VocabularyListPageProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [actionWord, setActionWord] = useState<WordItem | null>(null);
    const [noticeMenuOpen, setNoticeMenuOpen] = useState(false);
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
                onOpenActions={setActionWord}
            />
        ),
        [onPressWord],
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

    const handleToggleMenu = () => {
        if (menuOpen) {
            setNoticeMenuOpen(false);
        }

        onToggleMenu();
    };

    return (
        <ScreenLayout
            contentFillsViewport
            horizontalPadding={20}
            fixedTopOffset={40}
            scrollable={false}
            fixedTop={
                <FixedMenuRow $hasBadge={isPro}>
                    {isPro ? <ProBadgeText>PRO</ProBadgeText> : null}
                    <MenuButton
                        activeOpacity={0.8}
                        onPress={handleToggleMenu}
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
                            {noticeMenuOpen ? (
                                <>
                                    <NoticeMenuHeader>
                                        <NoticeBackButton
                                            activeOpacity={0.82}
                                            onPress={() =>
                                                setNoticeMenuOpen(false)
                                            }
                                        >
                                            <Feather
                                                name="chevron-left"
                                                size={20}
                                                color="#111111"
                                            />
                                        </NoticeBackButton>
                                        <NoticeMenuTitle>
                                            お知らせ
                                        </NoticeMenuTitle>
                                    </NoticeMenuHeader>
                                    <NoticeList>
                                        {notices.map((notice) => (
                                            <NoticeButton
                                                key={notice.id}
                                                activeOpacity={0.82}
                                                onPress={() => {
                                                    setNoticeMenuOpen(false);
                                                    onOpenNotice(notice);
                                                }}
                                            >
                                                <NoticeTitle>
                                                    {notice.title}
                                                </NoticeTitle>
                                                <Feather
                                                    name="external-link"
                                                    size={18}
                                                    color="#777777"
                                                />
                                            </NoticeButton>
                                        ))}
                                    </NoticeList>
                                </>
                            ) : (
                                <>
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
                                            onPress={() =>
                                                setNoticeMenuOpen(true)
                                            }
                                        >
                                            <PrimaryMenuLabel>
                                                お知らせ
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
                                        <PrimaryMenuButton
                                            activeOpacity={0.8}
                                            onPress={onLogout}
                                        >
                                            <PrimaryMenuLabel>
                                                ログアウト
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

                                    <AccountMenuGroup>
                                        <DangerMenuButton
                                            activeOpacity={0.8}
                                            onPress={() =>
                                                setShowDeleteConfirm(true)
                                            }
                                        >
                                            <DangerMenuLabel>
                                                アカウント削除
                                            </DangerMenuLabel>
                                        </DangerMenuButton>
                                    </AccountMenuGroup>
                                </>
                            )}
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
                ) : actionWord ? (
                    <WordActionOverlay>
                        <WordActionBackdrop
                            activeOpacity={1}
                            onPress={() => setActionWord(null)}
                        />
                        <WordActionCard>
                            <WordActionButton
                                activeOpacity={0.84}
                                onPress={() => {
                                    onAddWordToWidget(actionWord);
                                    setActionWord(null);
                                }}
                            >
                                <WordActionLabel>
                                    Widgetに表示
                                </WordActionLabel>
                            </WordActionButton>
                            <WordActionHint>
                                ※ Widget未追加の場合は先に追加してください。
                            </WordActionHint>
                            <WordActionDangerButton
                                activeOpacity={0.84}
                                onPress={() => {
                                    onDeleteWord(actionWord.id);
                                    setActionWord(null);
                                }}
                            >
                                <WordActionDangerLabel>
                                    削除
                                </WordActionDangerLabel>
                            </WordActionDangerButton>
                        </WordActionCard>
                    </WordActionOverlay>
                ) : null
            }
            fixedBottom={
                <BottomNavigation
                    activeTab="home"
                    onOpenHome={() => undefined}
                    onOpenSearch={onOpenSearch}
                    onOpenCards={onOpenCards}
                />
            }
        >
            <ListWrap>
                {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
                {chromeExtensionNoticeVisible ? (
                    <ChromeExtensionNoticeCard
                        onClose={onCloseChromeExtensionNotice}
                        onDismissPermanently={
                            onDismissChromeExtensionNoticePermanently
                        }
                    />
                ) : null}
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
        onOpenActions,
    }: {
        word: WordItem;
        onPressWord: (wordId: number) => void;
        onOpenActions: (word: WordItem) => void;
    }) => (
        <WordRow>
            <WordMain onPress={() => onPressWord(word.id)}>
                <WordTitle>{word.word || "Hello"}</WordTitle>
            </WordMain>
            <WordIconButton onPress={() => onOpenActions(word)}>
                <Feather
                    name="more-horizontal"
                    size={21}
                    color="#555555"
                />
            </WordIconButton>
        </WordRow>
    ),
);

const FixedMenuRow = styled.View<{ $hasBadge: boolean }>`
    flex-direction: row;
    justify-content: ${(props: { $hasBadge: boolean }) =>
        props.$hasBadge ? "space-between" : "flex-end"};
    align-items: center;
    padding-right: 14px;
`;

const MenuButton = styled.TouchableOpacity`
    width: 44px;
    height: 44px;
    align-items: flex-end;
    justify-content: center;
    transform: translateY(12px);
`;

const ProBadgeText = styled.Text`
    color: #111111;
    font-size: 12px;
    line-height: 16px;
    font-weight: 700;
    border-width: 1px;
    border-color: #111111;
    border-radius: 6px;
    padding: 3px 8px;
    transform: translateY(12px);
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
    margin-bottom: 12px;
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

const NoticeMenuHeader = styled.View`
    min-height: 44px;
    flex-direction: row;
    align-items: center;
    margin-bottom: 28px;
`;

const NoticeBackButton = styled.TouchableOpacity`
    width: 38px;
    height: 38px;
    align-items: flex-start;
    justify-content: center;
    margin-right: 4px;
`;

const NoticeMenuTitle = styled.Text`
    color: #111111;
    font-size: 22px;
    line-height: 28px;
    font-weight: 800;
`;

const NoticeList = styled.View`
    border-top-width: 0.5px;
    border-top-color: #e5e5e5;
`;

const NoticeButton = styled.TouchableOpacity`
    min-height: 62px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-bottom-width: 0.5px;
    border-bottom-color: #e5e5e5;
    padding: 14px 0;
`;

const NoticeTitle = styled.Text`
    flex: 1;
    color: #111111;
    font-size: 15px;
    line-height: 22px;
    font-weight: 700;
    margin-right: 14px;
`;

const ReferenceMenuGroup = styled.View`
    margin-bottom: 12px;
`;

const ReferenceMenuButton = styled.TouchableOpacity`
    padding-top: 6px;
    padding-bottom: 6px;
`;

const ReferenceMenuLabel = styled.Text`
    color: #8a8a8e;
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
`;

const AccountMenuGroup = styled.View`
    border-top-width: 0.5px;
    border-top-color: #e5e5e5;
    padding-top: 14px;
`;

const DangerMenuButton = styled.TouchableOpacity`
    padding-top: 0px;
`;

const DangerMenuLabel = styled.Text`
    color: #8a8a8e;
    font-size: 14px;
    line-height: 20px;
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

const WordIconButton = styled.TouchableOpacity`
    width: 30px;
    height: 30px;
    align-items: center;
    justify-content: center;
    margin-left: 6px;
`;

const WordActionOverlay = styled.View`
    flex: 1;
    justify-content: center;
    padding: 0 20px 84px;
`;

const WordActionBackdrop = styled.TouchableOpacity`
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    background-color: rgba(0, 0, 0, 0.16);
`;

const WordActionCard = styled.View`
    width: 100%;
    border-radius: 20px;
    background-color: #ffffff;
    padding: 24px 22px;
    shadow-color: #000000;
    shadow-opacity: 0.12;
    shadow-radius: 18px;
    shadow-offset: 0px 8px;
    elevation: 8;
`;

const WordActionButton = styled.TouchableOpacity`
    height: 54px;
    border-radius: 16px;
    background-color: #111111;
    align-items: center;
    justify-content: center;
`;

const WordActionLabel = styled.Text`
    color: #ffffff;
    font-size: 16px;
    line-height: 22px;
    font-weight: 800;
`;

const WordActionHint = styled.Text`
    color: #8a8a8e;
    font-size: 10px;
    line-height: 15px;
    font-weight: 500;
    margin-top: 8px;
    margin-bottom: 24px;
    margin-left: 4px;
`;

const WordActionDangerButton = styled.TouchableOpacity`
    height: 54px;
    border-radius: 16px;
    border-width: 1px;
    border-color: #edd1d7;
    background-color: #ffffff;
    align-items: center;
    justify-content: center;
`;

const WordActionDangerLabel = styled.Text`
    color: #d9485f;
    font-size: 16px;
    line-height: 22px;
    font-weight: 800;
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
