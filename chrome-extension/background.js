const API_BASE_URL = "https://sugu-app-dev.onrender.com";
const TOKEN_KEY = "suguAuthToken";
const GUEST_ID_KEY = "suguGuestId";
const AUTH_ORIGIN_TAB_KEY = "suguAppleAuthOriginTabId";
const AUTH_CALLBACK_PATHS = [
  "/api/v1/auth/apple/web/callback",
  "/auth/apple/web/callback"
];
const SUGU_PRO_URL = "https://apps.apple.com/search?term=Sugu";
const ERROR_MESSAGE_BY_CODE = {
  BAD_REQUEST: "入力内容に誤りがあります",
  UNAUTHORIZED: "認証に失敗しました",
  NOT_FOUND: "データが見つかりませんでした",
  CONFLICT: "既に登録されています",
  TOO_MANY_REQUESTS: "本日の検索回数の上限に達しました",
  INTERNAL_SERVER_ERROR: "サーバーエラーが発生しました",
  INTERNAL_ERROR: "サーバーエラーが発生しました"
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sugu-search-selection",
    title: "Suguで検索",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "sugu-search-selection" || !isInjectableTab(tab)) {
    return;
  }

  sendMessageToTab(tab.id, {
    type: "SUGU_SEARCH_SELECTION",
    word: info.selectionText ?? ""
  }).catch(() => {});
});

chrome.action.onClicked.addListener((tab) => {
  if (!isInjectableTab(tab)) {
    return;
  }

  togglePanel(tab);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-panel") {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!isInjectableTab(tab)) {
      return;
    }

    togglePanel(tab);
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SUGU_SEARCH") {
    searchWord(message.word)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse(toErrorResponse(error)));
    return true;
  }

  if (message?.type === "SUGU_SAVE") {
    saveWord(message.word)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse(toErrorResponse(error)));
    return true;
  }

  if (message?.type === "SUGU_GET_SETTINGS") {
    getSettings()
      .then((settings) => sendResponse({ ok: true, data: settings }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "SUGU_START_GUEST") {
    getOrCreateGuestId()
      .then((guestId) => sendResponse({ ok: true, data: { guestId } }))
      .catch((error) => sendResponse(toErrorResponse(error)));
    return true;
  }

  if (message?.type === "SUGU_START_APPLE_AUTH") {
    startAppleAuth(_sender.tab?.id)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse(toErrorResponse(error)));
    return true;
  }

  if (message?.type === "SUGU_COMPLETE_APPLE_AUTH") {
    completeAppleAuth(message.token, _sender.tab?.id)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse(toErrorResponse(error)));
    return true;
  }

  if (message?.type === "SUGU_OPEN_EXTERNAL") {
    openExternal(message.url)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse(toErrorResponse(error)));
    return true;
  }

  return false;
});

async function searchWord(word) {
  const trimmed = normalizeWord(word);
  if (!trimmed) {
    throw new Error("検索したい単語を入力してください。");
  }

  const token = await getToken();
  const headers = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers["X-Guest-Id"] = await getOrCreateGuestId();
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/dictionary/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ word: trimmed })
  });

  const text = await response.text();
  if (!response.ok) {
    await handleAuthExpired(response, token);
    throw createServerError(response, text, "検索に失敗しました。");
  }

  return JSON.parse(text);
}

async function saveWord(word) {
  const trimmed = normalizeWord(word);
  if (!trimmed) {
    throw new Error("保存する単語がありません。");
  }

  const token = await getToken();
  if (!token) {
    throw new Error("保存するにはログインが必要です。");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/words`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ word: trimmed })
  });

  if (!response.ok) {
    const text = await response.text();
    await handleAuthExpired(response, token);
    throw createServerError(response, text, "単語の保存に失敗しました。");
  }
}

async function getSettings() {
  const [token, guestId] = await Promise.all([getToken(), getGuestId()]);
  return {
    apiBaseUrl: API_BASE_URL,
    hasToken: Boolean(token),
    hasGuestId: Boolean(guestId),
    proUrl: SUGU_PRO_URL
  };
}

async function getToken() {
  const values = await chrome.storage.local.get(TOKEN_KEY);
  return typeof values[TOKEN_KEY] === "string" ? values[TOKEN_KEY] : "";
}

async function setToken(token) {
  if (!isJwtLikeToken(token)) {
    throw new Error("Appleログインの認証情報を取得できませんでした。");
  }

  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

async function getOrCreateGuestId() {
  const existingGuestId = await getGuestId();
  if (existingGuestId) {
    return existingGuestId;
  }

  const guestId = crypto.randomUUID();
  await chrome.storage.local.set({ [GUEST_ID_KEY]: guestId });
  return guestId;
}

async function getGuestId() {
  const values = await chrome.storage.local.get(GUEST_ID_KEY);
  return typeof values[GUEST_ID_KEY] === "string" ? values[GUEST_ID_KEY] : "";
}

async function handleAuthExpired(response, token) {
  if (token && response.status === 401) {
    await chrome.storage.local.remove(TOKEN_KEY);
  }
}

function normalizeWord(word) {
  return typeof word === "string" ? word.trim() : "";
}

function createServerError(response, text, fallback) {
  const parsed = parseServerError(text, fallback);
  const error = new Error(parsed.message);
  error.code = parsed.code;
  error.status = response.status;
  error.authExpired = response.status === 401;
  return error;
}

function parseServerError(text, fallback) {
  if (!text) {
    return { message: fallback, code: "" };
  }

  try {
    const data = JSON.parse(text);
    return resolveServerErrorMessage(data?.message, fallback);
  } catch {
    return resolveServerErrorMessage(text, fallback);
  }
}

function resolveServerErrorMessage(serverMessage, fallback) {
  if (!serverMessage) {
    return { message: fallback, code: "" };
  }

  return {
    message: ERROR_MESSAGE_BY_CODE[serverMessage] || serverMessage || fallback,
    code: ERROR_MESSAGE_BY_CODE[serverMessage] ? serverMessage : ""
  };
}

function toErrorResponse(error) {
  return {
    ok: false,
    error: error?.message ?? "エラーが発生しました。",
    code: error?.code ?? "",
    status: error?.status ?? 0,
    authExpired: Boolean(error?.authExpired)
  };
}

async function openExternal(url) {
  const targetUrl = typeof url === "string" && url ? url : SUGU_PRO_URL;
  await chrome.tabs.create({ url: targetUrl });
}

async function startAppleAuth(originTabId) {
  if (Number.isInteger(originTabId)) {
    await chrome.storage.local.set({ [AUTH_ORIGIN_TAB_KEY]: originTabId });
  } else {
    await chrome.storage.local.remove(AUTH_ORIGIN_TAB_KEY);
  }

  await chrome.tabs.create({ url: `${API_BASE_URL}/api/v1/auth/apple/web/start` });
}

async function completeAppleAuth(token, authTabId) {
  await setToken(token);

  const originTabId = await getAuthOriginTabId();
  await chrome.storage.local.remove(AUTH_ORIGIN_TAB_KEY);

  if (originTabId) {
    await sendMessageToTab(originTabId, { type: "SUGU_AUTH_COMPLETED" });
    await chrome.tabs.update(originTabId, { active: true }).catch(() => {});
  }

  if (authTabId && authTabId !== originTabId && isAppleAuthCallbackUrl(await getTabUrl(authTabId))) {
    await chrome.tabs.remove(authTabId).catch(() => {});
  }
}

async function getAuthOriginTabId() {
  const values = await chrome.storage.local.get(AUTH_ORIGIN_TAB_KEY);
  const tabId = values[AUTH_ORIGIN_TAB_KEY];
  return Number.isInteger(tabId) ? tabId : null;
}

async function getTabUrl(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.url ?? "";
  } catch {
    return "";
  }
}

function isAppleAuthCallbackUrl(url) {
  if (typeof url !== "string" || !url.startsWith(API_BASE_URL)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return AUTH_CALLBACK_PATHS.includes(parsed.pathname);
  } catch {
    return false;
  }
}

function isJwtLikeToken(token) {
  return typeof token === "string" && token.trim().split(".").length === 3;
}

function togglePanel(tab) {
  return sendMessageToTab(tab.id, {
    type: "SUGU_TOGGLE_PANEL"
  }).catch(() => {});
}

async function sendMessageToTab(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ["content.css"]
      });
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      });
      await chrome.tabs.sendMessage(tabId, message);
    } catch {
      // Chrome internal pages such as chrome://extensions don't allow injection.
    }
  }
}

function isInjectableTab(tab) {
  return Boolean(
    tab?.id &&
      typeof tab.url === "string" &&
      (tab.url.startsWith("http://") || tab.url.startsWith("https://"))
  );
}
