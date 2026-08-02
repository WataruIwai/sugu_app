const ROOT_ID = "sugu-extension-root";
const THEME_KEY = "suguTheme";
const LAYOUT_KEY = "suguLayoutMode";
const COLLAPSED_KEY = "suguCollapsed";
const LAYOUT_FLOATING = "floating";
const LAYOUT_DOCKED = "docked";
const VIEW_LOADING = "loading";
const VIEW_ONBOARDING = "onboarding";
const VIEW_SEARCH = "search";
const VIEW_LOGIN = "login";
const VIEW_SIGNUP = "signup";
const VIEW_GUEST_LIMIT_REACHED = "guestLimitReached";
const VIEW_PRO_INFO = "proInfo";
const DOCKED_WIDTH_CSS = "clamp(360px, 30vw, 460px)";
const PAGE_DOCKED_CLASS = "sugu-page-docked";
const FULLSCREEN_DOCKED_CLASS = "sugu-fullscreen-docked";
const YOUTUBE_DOCKED_CLASS = "sugu-youtube-docked";
const YOUTUBE_FULLSCREEN_DOCKED_CLASS = "sugu-youtube-fullscreen-docked";
const DISNEY_DOCKED_CLASS = "sugu-disney-docked";
const PRIME_DOCKED_CLASS = "sugu-prime-docked";
const AUTH_CALLBACK_PATHS = [
  "/api/v1/auth/apple/web/callback",
  "/auth/apple/web/callback"
];

let originalBodyStyles = null;
let currentFullscreenHost = null;
let currentDisneyHost = null;
let originalDisneyStyles = null;
let disneySyncRetryTimer = null;
let currentPrimeHost = null;
let originalPrimeStyles = null;
let currentPrimeOverlayHosts = [];
let originalPrimeOverlayStyles = new Map();
let primeSyncRetryTimer = null;
let currentYouTubeHosts = [];
let originalYouTubeStyles = new Map();
let youtubeSyncRetryTimer = null;
let lastSuguInput = null;
let lastKeyboardInputAt = 0;

const state = {
  appView: VIEW_LOADING,
  collapsed: false,
  settingsOpen: false,
  currentWord: "",
  result: null,
  hasToken: false,
  hasGuestId: false,
  proUrl: "",
  loading: false,
  position: null,
  theme: "light",
  layoutMode: LAYOUT_FLOATING,
  lastSearchError: ""
};

if (isAppleAuthCallbackPage()) {
  void completeAppleAuthFromCallbackPage();
} else {
  init();
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "SUGU_TOGGLE_PANEL") {
    setCollapsed(!state.collapsed);
  }

  if (message?.type === "SUGU_AUTH_COMPLETED") {
    handleAuthCompleted();
  }

  if (message?.type === "SUGU_SEARCH_SELECTION") {
    openPanel();
    const word = cleanSelection(message.word);
    if (word) {
      setInputValue(word);
      if (state.appView === VIEW_ONBOARDING || state.appView === VIEW_LOADING) {
        return;
      }
      void search(word);
    }
  }
});

async function completeAppleAuthFromCallbackPage() {
  const token = extractJwtFromDocument();

  if (!token) {
    renderAuthCallbackMessage("ログインに失敗しました。もう一度お試しください。");
    return;
  }

  const response = await sendMessage({ type: "SUGU_COMPLETE_APPLE_AUTH", token });

  if (!response.ok) {
    renderAuthCallbackMessage(response.error || "ログインに失敗しました。もう一度お試しください。");
    return;
  }

  renderAuthCallbackMessage("ログインが完了しました。Suguに戻ります。");
}

function isAppleAuthCallbackPage() {
  return AUTH_CALLBACK_PATHS.includes(window.location.pathname);
}

function extractJwtFromDocument() {
  const text = document.body?.innerText?.trim() ?? "";
  const match = text.match(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  return match?.[0] ?? "";
}

function renderAuthCallbackMessage(message) {
  document.documentElement.style.background = "#2f2f2f";
  document.body.style.margin = "0";
  document.body.style.minHeight = "100vh";
  document.body.style.display = "grid";
  document.body.style.placeItems = "center";
  document.body.style.background = "#2f2f2f";
  document.body.style.color = "#f7f7f7";
  document.body.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  document.body.textContent = "";
  document.body.append(
    createElement("div", {
      attributes: {
        style:
            "font-size: 18px; font-weight: 700; padding: 24px; text-align: center;"
      },
      text: message
    })
  );
}

function init() {
  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const root = document.createElement("div");
  root.id = ROOT_ID;
  getSuguHost().append(root);

  render();
  bindGlobalKeyboardGuards();
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  restoreSettings();
}

async function restoreSettings() {
  const [response, stored] = await Promise.all([
    sendMessage({ type: "SUGU_GET_SETTINGS" }),
    chrome.storage.local.get([THEME_KEY, LAYOUT_KEY, COLLAPSED_KEY])
  ]);

  if (response.ok) {
    state.hasToken = response.data.hasToken;
    state.hasGuestId = response.data.hasGuestId;
    state.proUrl = response.data.proUrl ?? "";
  }

  if (stored[THEME_KEY] === "dark" || stored[THEME_KEY] === "light") {
    state.theme = stored[THEME_KEY];
  }

  if (stored[LAYOUT_KEY] === LAYOUT_DOCKED || stored[LAYOUT_KEY] === LAYOUT_FLOATING) {
    state.layoutMode = stored[LAYOUT_KEY];
  }

  const canUseSearch = state.hasToken || state.hasGuestId;
  state.appView = canUseSearch ? VIEW_SEARCH : VIEW_ONBOARDING;
  state.collapsed = canUseSearch && stored[COLLAPSED_KEY] === true;
  render();
  scheduleDisneyLayoutRetries();
  schedulePrimeLayoutRetries();
  scheduleYouTubeDockedLayoutRetries();
}

function render() {
  const root = ensureRootMount();
  if (!root) {
    return;
  }

  root.innerHTML = "";
  root.className = [
    `sugu-theme-${state.theme}`,
    `sugu-layout-${state.layoutMode}`,
    state.collapsed ? "sugu-is-collapsed" : "",
    getFullscreenElement() ? "sugu-is-fullscreen" : ""
  ].filter(Boolean).join(" ");
  syncPageLayout();
  syncFullscreenLayout();
  syncDisneyLayout();
  syncPrimeLayout();
  syncYouTubeLayout();

  if (state.layoutMode === LAYOUT_DOCKED && state.collapsed) {
    root.style.left = "auto";
    root.style.top = getFullscreenElement() ? "10vh" : "6vh";
    root.style.right = "0";
    root.style.bottom = "auto";
    root.style.height = "";
    root.style.transform = "none";
  } else if (state.layoutMode === LAYOUT_DOCKED) {
    root.style.left = "auto";
    root.style.top = "0";
    root.style.right = "0";
    root.style.bottom = "0";
    root.style.height = "";
    root.style.transform = "none";
  } else if (state.position) {
    root.style.left = `${state.position.x}px`;
    root.style.top = `${state.position.y}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
    root.style.height = "";
    root.style.transform = "none";
  } else {
    root.style.left = "auto";
    root.style.top = "76px";
    root.style.right = "24px";
    root.style.bottom = "auto";
    root.style.height = "";
    root.style.transform = "none";
  }

  const panel = createElement("section", {
    className: `sugu-panel${state.collapsed ? " is-collapsed" : ""}`
  });
  panel.addEventListener("keydown", stopKeyboardEvent);
  panel.addEventListener("keyup", stopKeyboardEvent);
  panel.addEventListener("keypress", stopKeyboardEvent);

  const header = createElement("div", { className: "sugu-header" });
  header.addEventListener("pointerdown", startDrag);

  const logo = createLogo();
  const title = createElement("div", { className: "sugu-title" });
  title.append(logo);
  const themeButton = createIconButton(
    state.theme === "dark" ? "ライトモード" : "ダークモード",
    state.theme === "dark" ? "☀" : "☾",
    () => void toggleTheme()
  );
  const layoutButton = createIconButton(
    state.layoutMode === LAYOUT_DOCKED ? "自由配置にする" : "右側に固定",
    state.layoutMode === LAYOUT_DOCKED ? "⇱" : "▥",
    () => void toggleLayoutMode()
  );
  const collapsedDockHandle = state.layoutMode === LAYOUT_DOCKED && state.collapsed;
  const collapseButton = createIconButton(
    state.collapsed ? "Suguを開く" : "閉じる",
    collapsedDockHandle ? "☰" : state.collapsed ? "+" : "−",
    () => setCollapsed(!state.collapsed)
  );

  header.append(title);
  if (!state.collapsed) {
    header.append(themeButton, layoutButton);
  }
  header.append(collapseButton);

  const body = createElement("div", { className: "sugu-body" });

  if (state.appView === VIEW_LOADING) {
    body.append(renderLoadingView());
    panel.append(header, body);
    root.append(panel);
    return;
  }

  if (state.appView === VIEW_ONBOARDING) {
    body.append(renderOnboardingView());
    panel.append(header, body);
    root.append(panel);
    return;
  }

  if (state.appView === VIEW_LOGIN) {
    body.append(renderAuthInfoView({
      title: "ログイン",
      description: "Sign in with AppleでSuguアカウントにログインします。",
      primaryText: "Sign in with Appleでログイン",
      primaryAction: () => void startAppleAuth(),
      footnote: "認証画面を新しいタブで開きます。"
    }));
    panel.append(header, body);
    root.append(panel);
    return;
  }

  if (state.appView === VIEW_SIGNUP) {
    body.append(renderAuthInfoView({
      title: "アカウント作成",
      description: "無料アカウントを作成すると、登録ユーザー向けの検索回数を利用でき、単語を保存できます。",
      primaryText: "Sign in with Appleで作成",
      primaryAction: () => void startAppleAuth(),
      footnote: "認証画面を新しいタブで開きます。"
    }));
    panel.append(header, body);
    root.append(panel);
    return;
  }

  if (state.appView === VIEW_GUEST_LIMIT_REACHED) {
    body.append(renderGuestLimitReachedView());
    panel.append(header, body);
    root.append(panel);
    return;
  }

  if (state.appView === VIEW_PRO_INFO) {
    body.append(renderProInfoView());
    panel.append(header, body);
    root.append(panel);
    return;
  }

  if (!state.hasToken) {
    body.append(renderInlineLoginAction());
  }

  const searchRow = createElement("div", { className: "sugu-search-row" });
  const input = createElement("input", {
    className: "sugu-input",
    attributes: {
      type: "text",
      placeholder: "英単語を検索",
      value: state.currentWord
    }
  });
  input.addEventListener("input", () => {
    state.currentWord = input.value;
  });
  input.addEventListener("focus", () => {
    lastSuguInput = input;
  });
  input.addEventListener("blur", () => {
    restoreInputFocusAfterKeyboard(input);
  });
  input.addEventListener("keydown", (event) => {
    stopKeyboardEvent(event);
    if (event.key === "Enter") {
      event.preventDefault();
      void search(input.value);
    }
  });
  input.addEventListener("keyup", stopKeyboardEvent);
  input.addEventListener("keypress", stopKeyboardEvent);

  const searchButton = createElement("button", {
    className: "sugu-button sugu-search-button",
    text: state.loading ? "検索中" : "検索"
  });
  searchButton.disabled = state.loading;
  searchButton.addEventListener("click", () => {
    void search(input.value);
  });

  searchRow.append(input, searchButton);
  body.append(searchRow);

  const selectedButton = createElement("button", {
    className: "sugu-button sugu-secondary-button",
    text: "選択中の単語を入れる"
  });
  selectedButton.addEventListener("click", () => {
    const word = cleanSelection(window.getSelection()?.toString() ?? "");
    if (word) {
      setInputValue(word);
    } else {
      setStatus("選択中の単語がありません。", "error");
    }
  });
  body.append(createElement("div", { className: "sugu-actions", children: [selectedButton] }));

  const status = createElement("div", { className: "sugu-status", attributes: { "data-sugu-status": "true" } });
  body.append(status);

  if (state.result) {
    body.append(renderResult(state.result));
  }

  panel.append(header, body);
  root.append(panel);
}

function renderLoadingView() {
  return createElement("div", {
    className: "sugu-simple-view",
    children: [
      createElement("div", { className: "sugu-simple-title", text: "Sugu" }),
      createElement("div", { className: "sugu-simple-description", text: "読み込んでいます。" })
    ]
  });
}

function renderOnboardingView() {
  const guestButton = createElement("button", {
    className: "sugu-button sugu-primary-wide-button",
    text: "ゲストで始める"
  });
  guestButton.addEventListener("click", () => void startGuest());

  return createElement("div", {
    className: "sugu-onboarding",
    children: [
      createElement("div", { className: "sugu-onboarding-brand", text: "Sugu" }),
      createElement("div", { className: "sugu-onboarding-copy", text: "英語を読む流れを止めない" }),
      createElement("div", { className: "sugu-onboarding-limit", text: "3回まで無料で試せます" }),
      guestButton,
      createAuthChoice("アカウントをお持ちの方", "ログイン", () => showView(VIEW_LOGIN)),
      createAuthChoice("初めて利用する方", "アカウント作成", () => showView(VIEW_SIGNUP))
    ]
  });
}

function createAuthChoice(label, buttonText, onClick) {
  const button = createElement("button", {
    className: "sugu-button sugu-outline-wide-button",
    text: buttonText
  });
  button.addEventListener("click", onClick);

  return createElement("div", {
    className: "sugu-auth-choice",
    children: [
      createElement("div", { className: "sugu-auth-choice-label", text: label }),
      button
    ]
  });
}

function renderAuthInfoView({ title, description, primaryText, primaryAction, footnote }) {
  const primaryButton = createElement("button", {
    className: "sugu-button sugu-primary-wide-button",
    text: primaryText
  });
  primaryButton.addEventListener("click", primaryAction);

  const guestButton = createElement("button", {
    className: "sugu-button sugu-outline-wide-button",
    text: "ゲストで続ける"
  });
  guestButton.addEventListener("click", () => void startGuest());

  return createElement("div", {
    className: "sugu-simple-view",
    children: [
      createElement("div", { className: "sugu-simple-title", text: title }),
      createElement("div", { className: "sugu-simple-description", text: description }),
      primaryButton,
      guestButton,
      createElement("div", { className: "sugu-simple-footnote", text: footnote })
    ]
  });
}

function renderInlineLoginAction() {
  const loginButton = createElement("button", {
    className: "sugu-button sugu-inline-login-button",
    text: "Sign in with Appleでログイン"
  });
  loginButton.addEventListener("click", () => void startAppleAuth());

  return createElement("div", {
    className: "sugu-inline-login",
    children: [loginButton]
  });
}

function renderGuestLimitReachedView() {
  const signupButton = createElement("button", {
    className: "sugu-button sugu-primary-wide-button",
    text: "無料でアカウント作成"
  });
  signupButton.addEventListener("click", () => showView(VIEW_SIGNUP));

  const loginButton = createElement("button", {
    className: "sugu-button sugu-outline-wide-button",
    text: "ログイン"
  });
  loginButton.addEventListener("click", () => showView(VIEW_LOGIN));

  const proButton = createElement("button", {
    className: "sugu-link-button",
    text: "Sugu Proについて見る"
  });
  proButton.addEventListener("click", () => showView(VIEW_PRO_INFO));

  return createElement("div", {
    className: "sugu-limit-view",
    children: [
      createElement("div", { className: "sugu-simple-title", text: "本日の無料検索を使い切りました" }),
      createElement("div", {
        className: "sugu-simple-description",
        text: "無料のアカウントを作成すると、登録ユーザー向けの検索回数を利用できます。"
      }),
      createElement("div", {
        className: "sugu-simple-description",
        text: "Sugu Proなら、検索回数を気にせず利用できます。"
      }),
      signupButton,
      loginButton,
      proButton
    ]
  });
}

function renderProInfoView() {
  const openButton = createElement("button", {
    className: "sugu-button sugu-primary-wide-button",
    text: "Sugu Proの案内を開く"
  });
  openButton.addEventListener("click", () => void openProLink());

  const backButton = createElement("button", {
    className: "sugu-button sugu-outline-wide-button",
    text: "戻る"
  });
  backButton.addEventListener("click", () => {
    state.appView = state.lastSearchError ? VIEW_GUEST_LIMIT_REACHED : VIEW_SEARCH;
    render();
  });

  return createElement("div", {
    className: "sugu-simple-view",
    children: [
      createElement("div", { className: "sugu-simple-title", text: "Sugu Pro" }),
      createElement("div", {
        className: "sugu-simple-description",
        text: "Sugu Proでは、検索回数を気にせず英語の検索体験を続けられます。"
      }),
      openButton,
      backButton,
      createElement("div", {
        className: "sugu-simple-footnote",
        text: "Chrome拡張内で直接購入する処理はまだ接続していません。既存の案内先を開きます。"
      })
    ]
  });
}

function renderResult(result) {
  const wrapper = createElement("div", { className: "sugu-result" });
  const word = result.word ?? state.currentWord;
  wrapper.append(
    createElement("div", { className: "sugu-word", text: word }),
    renderPronunciationButton(word)
  );

  const entries = Array.isArray(result.entries) ? result.entries : [];
  for (const entry of entries.slice(0, 3)) {
    const item = createElement("div", { className: "sugu-entry" });
    item.append(
      createElement("div", { className: "sugu-meaning-en", text: entry.meaning_en ?? entry.meaning ?? "" }),
      createElement("div", { className: "sugu-meaning-ja", text: entry.meaning_ja ?? entry.japanese ?? "" })
    );
    if (entry.example) {
      item.append(createElement("div", { className: "sugu-example", text: entry.example }));
    }
    wrapper.append(item);
  }

  if (Array.isArray(result.candidates) && result.candidates.length > 0) {
    const candidates = createElement("div", { className: "sugu-entry" });
    candidates.append(createElement("div", { className: "sugu-meaning-en", text: "候補" }));
    candidates.append(createElement("div", { className: "sugu-meaning-ja", text: result.candidates.join(", ") }));
    wrapper.append(candidates);
  }

  const saveButton = createElement("button", {
    className: "sugu-button sugu-add-button",
    text: state.hasToken ? "単語を保存" : "Sign in with Appleでログイン"
  });
  saveButton.addEventListener("click", () => {
    if (!state.hasToken) {
      void startAppleAuth();
      return;
    }

    void saveCurrentWord();
  });

  wrapper.append(createElement("div", { className: "sugu-actions", children: [saveButton] }));
  return wrapper;
}

function renderPronunciationButton(word) {
  const button = createElement("button", {
    className: "sugu-pronunciation-button",
    attributes: {
      type: "button",
      title: "発音を聞く"
    }
  });
  button.append(
    createVolumeIcon(),
    createElement("span", { text: "発音を聞く" })
  );
  button.addEventListener("click", () => speakWord(word));
  return button;
}

function createLogo() {
  const image = createElement("img", {
    className: "sugu-logo",
    attributes: {
      src: chrome.runtime.getURL("assets/sugu-logo.svg"),
      alt: "Sugu",
      draggable: "false"
    }
  });
  return image;
}

function createVolumeIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "sugu-pronunciation-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", "11 5 6 9 2 9 2 15 6 15 11 19 11 5");

  const waveSmall = document.createElementNS("http://www.w3.org/2000/svg", "path");
  waveSmall.setAttribute("d", "M15.5 8.5a5 5 0 0 1 0 7");

  const waveLarge = document.createElementNS("http://www.w3.org/2000/svg", "path");
  waveLarge.setAttribute("d", "M19 5a9 9 0 0 1 0 14");

  svg.append(polygon, waveSmall, waveLarge);
  return svg;
}

async function search(word) {
  const trimmed = cleanSelection(word);
  if (!trimmed) {
    setStatus("検索したい単語を入力してください。", "error");
    return;
  }

  state.currentWord = trimmed;
  state.loading = true;
  state.result = null;
  state.lastSearchError = "";
  render();
  setStatus("検索しています。");

  const response = await sendMessage({ type: "SUGU_SEARCH", word: trimmed });
  state.loading = false;

  if (!response.ok) {
    if (response.authExpired) {
      state.hasToken = false;
      state.appView = state.hasGuestId ? VIEW_SEARCH : VIEW_LOGIN;
    }

    if (isGuestSearchLimitError(response)) {
      state.lastSearchError = response.error;
      state.appView = VIEW_GUEST_LIMIT_REACHED;
      render();
      return;
    }

    state.result = null;
    render();
    setStatus(response.error, "error");
    return;
  }

  state.result = response.data;
  state.currentWord = response.data.word ?? trimmed;
  if (!state.hasToken) {
    state.hasGuestId = true;
  }
  state.appView = VIEW_SEARCH;
  render();
}

async function saveCurrentWord() {
  const word = state.result?.word ?? state.currentWord;
  const response = await sendMessage({ type: "SUGU_SAVE", word });
  if (!response.ok) {
    if (response.authExpired) {
      state.hasToken = false;
      state.appView = state.hasGuestId ? VIEW_SEARCH : VIEW_LOGIN;
      render();
    }
    setStatus(response.error, "error");
    return;
  }
  setStatus("単語を保存しました。", "success");
}

async function startGuest() {
  state.loading = true;
  state.collapsed = false;
  render();

  const response = await sendMessage({ type: "SUGU_START_GUEST" });
  state.loading = false;

  if (!response.ok) {
    state.appView = VIEW_ONBOARDING;
    render();
    setStatus(response.error, "error");
    return;
  }

  state.hasGuestId = true;
  state.appView = VIEW_SEARCH;
  await chrome.storage.local.set({ [COLLAPSED_KEY]: false });
  render();
}

function showView(view) {
  state.appView = view;
  render();
}

async function startAppleAuth() {
  const response = await sendMessage({ type: "SUGU_START_APPLE_AUTH" });
  if (!response.ok) {
    setStatus(response.error, "error");
  }
}

function handleAuthCompleted() {
  state.hasToken = true;
  state.appView = VIEW_SEARCH;
  state.lastSearchError = "";
  render();
  setStatus("ログインしました。", "success");
}

async function openProLink() {
  const response = await sendMessage({ type: "SUGU_OPEN_EXTERNAL", url: state.proUrl });
  if (!response.ok) {
    setStatus(response.error, "error");
  }
}

function isGuestSearchLimitError(response) {
  return (
    !state.hasToken &&
    (response?.status === 429 ||
      response?.code === "TOO_MANY_REQUESTS" ||
      String(response?.error ?? "").includes("上限"))
  );
}

function speakWord(word) {
  const text = cleanSelection(word);
  if (!text || !window.speechSynthesis) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.pitch = 1;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

async function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  await chrome.storage.local.set({ [THEME_KEY]: state.theme });
  render();
}

async function toggleLayoutMode() {
  state.layoutMode = state.layoutMode === LAYOUT_DOCKED ? LAYOUT_FLOATING : LAYOUT_DOCKED;
  if (state.layoutMode === LAYOUT_DOCKED) {
    state.position = null;
  }
  await chrome.storage.local.set({ [LAYOUT_KEY]: state.layoutMode });
  render();
  scheduleDisneyLayoutRetries();
  schedulePrimeLayoutRetries();
  scheduleYouTubeDockedLayoutRetries();
}

function setInputValue(value) {
  state.currentWord = cleanSelection(value);
  render();
}

function setStatus(message, type = "") {
  const status = document.querySelector(`#${ROOT_ID} [data-sugu-status="true"]`);
  if (!status) {
    return;
  }
  status.textContent = message;
  status.className = `sugu-status${type ? ` is-${type}` : ""}`;
}

function openPanel() {
  setCollapsed(false);
}

function setCollapsed(collapsed) {
  const changed = state.collapsed !== collapsed;
  state.collapsed = collapsed;
  void chrome.storage.local.set({ [COLLAPSED_KEY]: collapsed });
  render();

  if (!changed) {
    return;
  }

  if (isPrimeVideoPage()) {
    if (!state.collapsed) {
      schedulePrimeLayoutRetries();
    }
    return;
  }

  if (isYouTubePage()) {
    if (state.collapsed) {
      scheduleYouTubeResize();
      return;
    }

    scheduleYouTubeDockedLayoutRetries();
    scheduleYouTubeResize();
  }
}

function handleFullscreenChange() {
  ensureRootMount();
  render();
  schedulePrimeLayoutRetries();
  scheduleYouTubeDockedLayoutRetries();
}

function ensureRootMount() {
  const root = document.getElementById(ROOT_ID);
  if (!root) {
    return null;
  }

  const host = getSuguHost();
  if (root.parentElement !== host) {
    host.append(root);
  }

  return root;
}

function getSuguHost() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.documentElement;
}

function syncPageLayout() {
  const wasDockedPage = Boolean(originalBodyStyles);
  const shouldDockPage =
    state.layoutMode === LAYOUT_DOCKED &&
    !state.collapsed &&
    !getFullscreenElement() &&
    !isPrimeVideoPage() &&
    !isYouTubePage();
  document.documentElement.style.setProperty("--sugu-docked-width", DOCKED_WIDTH_CSS);
  document.documentElement.classList.toggle(PAGE_DOCKED_CLASS, shouldDockPage);

  if (!document.body) {
    return;
  }

  if (shouldDockPage) {
    if (!originalBodyStyles) {
      originalBodyStyles = {
        marginRight: document.body.style.marginRight,
        maxWidth: document.body.style.maxWidth,
        computedMarginRight: window.getComputedStyle(document.body).marginRight
      };
    }

    document.body.style.marginRight = `calc(${DOCKED_WIDTH_CSS} + ${originalBodyStyles.computedMarginRight})`;
    document.body.style.maxWidth = `calc(100vw - ${DOCKED_WIDTH_CSS})`;
    return;
  }

  if (originalBodyStyles) {
    document.body.style.marginRight = originalBodyStyles.marginRight;
    document.body.style.maxWidth = originalBodyStyles.maxWidth;
    originalBodyStyles = null;
  }

  if (!shouldDockPage) {
    resetDisneyLayout();
    resetPrimeLayout();
    resetYouTubeLayout();
    if (wasDockedPage && isYouTubePage()) {
      scheduleYouTubeResize();
    }
  }
}

function syncFullscreenLayout() {
  const fullscreenElement = getFullscreenElement();
  const shouldDockFullscreen =
    fullscreenElement &&
    state.layoutMode === LAYOUT_DOCKED &&
    !state.collapsed &&
    !isPrimeVideoPage() &&
    !isYouTubePage();

  if (currentFullscreenHost && currentFullscreenHost !== fullscreenElement) {
    currentFullscreenHost.classList.remove(FULLSCREEN_DOCKED_CLASS);
    currentFullscreenHost.classList.remove(YOUTUBE_FULLSCREEN_DOCKED_CLASS);
    resetYouTubeLayout();
  }

  if (shouldDockFullscreen) {
    fullscreenElement.style.setProperty("--sugu-docked-width", DOCKED_WIDTH_CSS);
    fullscreenElement.classList.add(FULLSCREEN_DOCKED_CLASS);
    fullscreenElement.classList.toggle(YOUTUBE_FULLSCREEN_DOCKED_CLASS, false);
    currentFullscreenHost = fullscreenElement;
    return;
  }

  if (currentFullscreenHost) {
    currentFullscreenHost.classList.remove(FULLSCREEN_DOCKED_CLASS);
    currentFullscreenHost.classList.remove(YOUTUBE_FULLSCREEN_DOCKED_CLASS);
    currentFullscreenHost = null;
    resetYouTubeLayout();
  }
}

function syncYouTubeLayout() {
  const shouldDockYouTube = shouldReserveYouTubePageDock();
  const shouldDockYouTubeFullscreen = shouldDockYouTubeFullscreenLayout();
  const shouldDockAnyYouTube = shouldDockYouTube || shouldDockYouTubeFullscreen;

  document.documentElement.classList.toggle(YOUTUBE_DOCKED_CLASS, shouldDockYouTube);
  if (!shouldDockAnyYouTube) {
    resetYouTubeLayout();
    return;
  }

  document.documentElement.style.setProperty("--sugu-docked-width", DOCKED_WIDTH_CSS);

  if (shouldDockYouTube && !shouldDockYouTubeFullscreen) {
    restoreYouTubeInlineStyles();
    return;
  }

  const hosts = shouldDockYouTubeFullscreen
    ? findYouTubeFullscreenHosts()
    : findYouTubePageHosts();

  if (hosts.length === 0) {
    scheduleYouTubeDockedLayoutRetries();
    return;
  }

  restoreRemovedYouTubeHosts(hosts);

  for (const host of hosts) {
    rememberYouTubeStyles(host);
    applyYouTubeDockStyle(host, shouldDockYouTubeFullscreen);
  }

  currentYouTubeHosts = hosts;
}

function syncYouTubeDockedLayout() {
  syncYouTubeLayout();
}

function resetYouTubeLayout() {
  document.documentElement.classList.remove(YOUTUBE_DOCKED_CLASS);
  clearYouTubeLayoutRetries();
  restoreYouTubeInlineStyles();
}

function restoreYouTubeInlineStyles() {
  for (const [host, styles] of originalYouTubeStyles.entries()) {
    host.style.width = styles.width;
    host.style.maxWidth = styles.maxWidth;
    host.style.height = styles.height;
    host.style.minWidth = styles.minWidth;
    host.style.boxSizing = styles.boxSizing;
    host.style.overflow = styles.overflow;
    host.style.left = styles.left;
    host.style.right = styles.right;
    host.style.top = styles.top;
    host.style.transform = styles.transform;
    host.style.objectFit = styles.objectFit;
    host.style.position = styles.position;
  }

  currentYouTubeHosts = [];
  originalYouTubeStyles = new Map();
}

function restoreRemovedYouTubeHosts(nextHosts) {
  const nextHostSet = new Set(nextHosts);

  for (const host of currentYouTubeHosts) {
    if (nextHostSet.has(host)) {
      continue;
    }

    const styles = originalYouTubeStyles.get(host);
    if (!styles) {
      continue;
    }

    host.style.width = styles.width;
    host.style.maxWidth = styles.maxWidth;
    host.style.height = styles.height;
    host.style.minWidth = styles.minWidth;
    host.style.boxSizing = styles.boxSizing;
    host.style.overflow = styles.overflow;
    host.style.left = styles.left;
    host.style.right = styles.right;
    host.style.top = styles.top;
    host.style.transform = styles.transform;
    host.style.objectFit = styles.objectFit;
    host.style.position = styles.position;
    originalYouTubeStyles.delete(host);
  }
}

function rememberYouTubeStyles(host) {
  if (originalYouTubeStyles.has(host)) {
    return;
  }

  originalYouTubeStyles.set(host, {
    width: host.style.width,
    maxWidth: host.style.maxWidth,
    height: host.style.height,
    minWidth: host.style.minWidth,
    boxSizing: host.style.boxSizing,
    overflow: host.style.overflow,
    left: host.style.left,
    right: host.style.right,
    top: host.style.top,
    transform: host.style.transform,
    objectFit: host.style.objectFit,
    position: host.style.position
  });
}

function scheduleYouTubeDockedLayoutRetries() {
  if ((!shouldDockYouTubeLayout() && !shouldDockYouTubeFullscreenLayout()) || youtubeSyncRetryTimer) {
    return;
  }

  let attempts = 0;
  youtubeSyncRetryTimer = window.setInterval(() => {
    attempts += 1;
    syncYouTubeDockedLayout();

    if (attempts >= 20 || (!shouldDockYouTubeLayout() && !shouldDockYouTubeFullscreenLayout())) {
      clearYouTubeLayoutRetries();
    }
  }, 250);
}

function clearYouTubeLayoutRetries() {
  if (!youtubeSyncRetryTimer) {
    return;
  }

  window.clearInterval(youtubeSyncRetryTimer);
  youtubeSyncRetryTimer = null;
}

function shouldDockYouTubeLayout() {
  return shouldReserveYouTubePageDock();
}

function shouldReserveYouTubePageDock() {
  return (
    isYouTubePage() &&
    state.layoutMode === LAYOUT_DOCKED &&
    !state.collapsed &&
    !getFullscreenElement()
  );
}

function shouldDockYouTubeFullscreenLayout() {
  return (
    isYouTubePage() &&
    state.layoutMode === LAYOUT_DOCKED &&
    !state.collapsed &&
    Boolean(getFullscreenElement())
  );
}

function findYouTubePageHosts() {
  return uniqueElements([
    document.querySelector("ytd-app"),
    document.querySelector("ytd-page-manager"),
    document.querySelector("ytd-watch-flexy"),
    document.querySelector("#page-manager"),
    document.querySelector("#columns"),
    document.querySelector("#primary"),
    document.querySelector("ytd-masthead"),
    document.querySelector("ytd-masthead #container"),
    document.querySelector("ytd-masthead #center"),
    document.querySelector("ytd-masthead #end"),
    document.querySelector("#related"),
    document.querySelector("#secondary"),
    document.querySelector("#secondary-inner"),
    document.querySelector("#chips-wrapper"),
    document.querySelector("#items"),
    document.querySelector("#player"),
    document.querySelector("#player-container"),
    document.querySelector("#player-container-outer"),
    document.querySelector("#player-theater-container"),
    document.querySelector("#movie_player"),
    document.querySelector(".html5-video-player")
  ]);
}

function findYouTubeFullscreenHosts() {
  const fullscreenElement = getFullscreenElement();
  if (!fullscreenElement) {
    return [];
  }

  return uniqueElements([
    fullscreenElement.querySelector(".html5-video-container"),
    fullscreenElement.querySelector("video.html5-main-video"),
    fullscreenElement.querySelector(".ytp-caption-window-container"),
    fullscreenElement.querySelector(".ytp-chrome-bottom")
  ]);
}

function applyYouTubeDockStyle(host, isFullscreen) {
  const contentWidth = `calc(100vw - ${DOCKED_WIDTH_CSS})`;
  host.style.width = contentWidth;
  host.style.maxWidth = contentWidth;
  host.style.boxSizing = "border-box";

  if (!isFullscreen) {
    if (host.matches("ytd-app, ytd-page-manager, ytd-watch-flexy, #page-manager, #columns, #primary, ytd-masthead, ytd-masthead #container, ytd-masthead #center, ytd-masthead #end, #related, #secondary, #secondary-inner, #chips-wrapper, #items")) {
      host.style.minWidth = "0";
      host.style.overflow = host.matches("ytd-masthead, ytd-masthead #container") ? "hidden" : "visible";
    }
    if (host.matches("ytd-masthead")) {
      host.style.left = "0";
      host.style.right = DOCKED_WIDTH_CSS;
    }
    return;
  }

  if (host.matches("video.html5-main-video")) {
    host.style.height = "100vh";
    host.style.left = "0";
    host.style.top = "0";
    host.style.objectFit = "contain";
    host.style.transform = "none";
    return;
  }

  if (host.classList.contains("html5-video-container")) {
    host.style.height = "100vh";
    host.style.left = "0";
    host.style.top = "0";
    host.style.overflow = "hidden";
    return;
  }

  if (host.classList.contains("ytp-caption-window-container")) {
    host.style.left = "0";
    host.style.right = DOCKED_WIDTH_CSS;
    return;
  }

  if (host.classList.contains("ytp-chrome-bottom")) {
    host.style.left = "12px";
    host.style.width = `calc(100vw - ${DOCKED_WIDTH_CSS} - 24px)`;
    host.style.maxWidth = `calc(100vw - ${DOCKED_WIDTH_CSS} - 24px)`;
  }
}

function scheduleYouTubeResize() {
  window.requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
    document.dispatchEvent(new Event("yt-page-data-updated"));

    window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 120);
  });
}

function syncDisneyLayout() {
  const shouldDockDisney = shouldDockDisneyLayout();

  document.documentElement.classList.toggle(DISNEY_DOCKED_CLASS, shouldDockDisney);
  if (!shouldDockDisney) {
    resetDisneyLayout();
    return;
  }

  document.documentElement.style.setProperty("--sugu-docked-width", DOCKED_WIDTH_CSS);

  const host = findVideoViewportHost();
  if (!host) {
    scheduleDisneyLayoutRetries();
    return;
  }

  if (currentDisneyHost && currentDisneyHost !== host) {
    resetDisneyLayout();
  }

  if (!originalDisneyStyles) {
    originalDisneyStyles = {
      width: host.style.width,
      maxWidth: host.style.maxWidth,
      right: host.style.right,
      boxSizing: host.style.boxSizing,
      overflow: host.style.overflow
    };
  }

  host.style.width = `calc(100vw - ${DOCKED_WIDTH_CSS})`;
  host.style.maxWidth = `calc(100vw - ${DOCKED_WIDTH_CSS})`;
  host.style.right = DOCKED_WIDTH_CSS;
  host.style.boxSizing = "border-box";
  host.style.overflow = "hidden";
  currentDisneyHost = host;
}

function syncPrimeLayout() {
  const shouldDockPrime = shouldDockPrimeLayout();

  document.documentElement.classList.toggle(PRIME_DOCKED_CLASS, shouldDockPrime);
  if (!shouldDockPrime) {
    resetPrimeLayout();
    return;
  }

  document.documentElement.style.setProperty("--sugu-docked-width", DOCKED_WIDTH_CSS);

  const host = findPrimeVideoViewportHost();
  if (!host) {
    schedulePrimeLayoutRetries();
    return;
  }

  if (currentPrimeHost && currentPrimeHost !== host) {
    resetPrimeLayout();
  }

  if (!originalPrimeStyles) {
    originalPrimeStyles = {
      width: host.style.width,
      maxWidth: host.style.maxWidth,
      height: host.style.height,
      right: host.style.right,
      left: host.style.left,
      top: host.style.top,
      boxSizing: host.style.boxSizing,
      overflow: host.style.overflow,
      position: host.style.position
    };
  }

  host.style.width = `calc(100vw - ${DOCKED_WIDTH_CSS})`;
  host.style.maxWidth = `calc(100vw - ${DOCKED_WIDTH_CSS})`;
  if (getFullscreenElement()) {
    host.style.height = "100vh";
    host.style.left = "0";
    host.style.top = "0";
    host.style.position = host === getFullscreenElement() ? "relative" : host.style.position;
  }
  host.style.right = DOCKED_WIDTH_CSS;
  host.style.boxSizing = "border-box";
  host.style.overflow = "hidden";
  currentPrimeHost = host;

  syncPrimeOverlayLayout(host);
}

function resetPrimeLayout() {
  document.documentElement.classList.remove(PRIME_DOCKED_CLASS);
  clearPrimeLayoutRetries();
  restorePrimeOverlayStyles();

  if (!currentPrimeHost || !originalPrimeStyles) {
    currentPrimeHost = null;
    originalPrimeStyles = null;
    return;
  }

  currentPrimeHost.style.width = originalPrimeStyles.width;
  currentPrimeHost.style.maxWidth = originalPrimeStyles.maxWidth;
  currentPrimeHost.style.height = originalPrimeStyles.height;
  currentPrimeHost.style.right = originalPrimeStyles.right;
  currentPrimeHost.style.left = originalPrimeStyles.left;
  currentPrimeHost.style.top = originalPrimeStyles.top;
  currentPrimeHost.style.boxSizing = originalPrimeStyles.boxSizing;
  currentPrimeHost.style.overflow = originalPrimeStyles.overflow;
  currentPrimeHost.style.position = originalPrimeStyles.position;
  currentPrimeHost = null;
  originalPrimeStyles = null;
}

function syncPrimeOverlayLayout(videoHost) {
  if (!getFullscreenElement()) {
    restorePrimeOverlayStyles();
    return;
  }

  const overlayHosts = findPrimeFullscreenOverlayHosts(videoHost);
  const scrubberHosts = findPrimeFullscreenScrubberHosts();
  const hosts = uniqueElements([...overlayHosts, ...scrubberHosts]);
  restoreRemovedPrimeOverlayHosts(hosts);

  for (const overlayHost of hosts) {
    rememberPrimeOverlayStyles(overlayHost);
    const width = isPrimeScrubberElement(overlayHost)
      ? `calc(100vw - ${DOCKED_WIDTH_CSS} - 24px)`
      : `calc(100vw - ${DOCKED_WIDTH_CSS})`;
    overlayHost.style.setProperty("width", width, "important");
    overlayHost.style.setProperty("max-width", width, "important");
    overlayHost.style.setProperty("left", "0", "important");
    overlayHost.style.setProperty("right", DOCKED_WIDTH_CSS, "important");
    overlayHost.style.setProperty("box-sizing", "border-box", "important");
    overlayHost.style.setProperty("min-width", "0", "important");
    overlayHost.style.setProperty("overflow", "hidden", "important");
  }

  currentPrimeOverlayHosts = hosts;
}

function isPrimeScrubberElement(element) {
  const className = String(element.className ?? "");
  return (
    className.includes("f102imk2") ||
    className.includes("f1jovyhs") ||
    className.includes("fzu5eck") ||
    className.includes("f19vh6ps") ||
    className.includes("atvwebplayersdk-tick-mark-mask")
  );
}

function rememberPrimeOverlayStyles(host) {
  if (originalPrimeOverlayStyles.has(host)) {
    return;
  }

  originalPrimeOverlayStyles.set(host, {
    width: host.style.width,
    maxWidth: host.style.maxWidth,
    minWidth: host.style.minWidth,
    left: host.style.left,
    right: host.style.right,
    boxSizing: host.style.boxSizing,
    overflow: host.style.overflow
  });
}

function restoreRemovedPrimeOverlayHosts(nextHosts) {
  const nextHostSet = new Set(nextHosts);

  for (const host of currentPrimeOverlayHosts) {
    if (nextHostSet.has(host)) {
      continue;
    }

    const styles = originalPrimeOverlayStyles.get(host);
    if (!styles) {
      continue;
    }

    host.style.width = styles.width;
    host.style.maxWidth = styles.maxWidth;
    host.style.minWidth = styles.minWidth;
    host.style.left = styles.left;
    host.style.right = styles.right;
    host.style.boxSizing = styles.boxSizing;
    host.style.overflow = styles.overflow;
    originalPrimeOverlayStyles.delete(host);
  }
}

function restorePrimeOverlayStyles() {
  for (const [host, styles] of originalPrimeOverlayStyles.entries()) {
    host.style.width = styles.width;
    host.style.maxWidth = styles.maxWidth;
    host.style.minWidth = styles.minWidth;
    host.style.left = styles.left;
    host.style.right = styles.right;
    host.style.boxSizing = styles.boxSizing;
    host.style.overflow = styles.overflow;
  }

  currentPrimeOverlayHosts = [];
  originalPrimeOverlayStyles = new Map();
}

function schedulePrimeLayoutRetries() {
  if (!shouldDockPrimeLayout() || primeSyncRetryTimer) {
    return;
  }

  let attempts = 0;
  primeSyncRetryTimer = window.setInterval(() => {
    attempts += 1;
    syncPrimeLayout();

    if ((!getFullscreenElement() && currentPrimeHost) || attempts >= 40 || !shouldDockPrimeLayout()) {
      clearPrimeLayoutRetries();
    }
  }, 250);
}

function clearPrimeLayoutRetries() {
  if (!primeSyncRetryTimer) {
    return;
  }

  window.clearInterval(primeSyncRetryTimer);
  primeSyncRetryTimer = null;
}

function resetDisneyLayout() {
  document.documentElement.classList.remove(DISNEY_DOCKED_CLASS);
  clearDisneyLayoutRetries();

  if (!currentDisneyHost || !originalDisneyStyles) {
    currentDisneyHost = null;
    originalDisneyStyles = null;
    return;
  }

  currentDisneyHost.style.width = originalDisneyStyles.width;
  currentDisneyHost.style.maxWidth = originalDisneyStyles.maxWidth;
  currentDisneyHost.style.right = originalDisneyStyles.right;
  currentDisneyHost.style.boxSizing = originalDisneyStyles.boxSizing;
  currentDisneyHost.style.overflow = originalDisneyStyles.overflow;
  currentDisneyHost = null;
  originalDisneyStyles = null;
}

function scheduleDisneyLayoutRetries() {
  if (!shouldDockDisneyLayout() || disneySyncRetryTimer) {
    return;
  }

  let attempts = 0;
  disneySyncRetryTimer = window.setInterval(() => {
    attempts += 1;
    syncDisneyLayout();

    if (currentDisneyHost || attempts >= 20 || !shouldDockDisneyLayout()) {
      clearDisneyLayoutRetries();
    }
  }, 250);
}

function clearDisneyLayoutRetries() {
  if (!disneySyncRetryTimer) {
    return;
  }

  window.clearInterval(disneySyncRetryTimer);
  disneySyncRetryTimer = null;
}

function shouldDockDisneyLayout() {
  return (
    isDisneyPlusPage() &&
    state.layoutMode === LAYOUT_DOCKED &&
    !state.collapsed &&
    !getFullscreenElement()
  );
}

function shouldDockPrimeLayout() {
  return (
    isPrimeVideoPage() &&
    state.layoutMode === LAYOUT_DOCKED &&
    !state.collapsed
  );
}

function isDisneyPlusPage() {
  return location.hostname.includes("disneyplus.com");
}

function isPrimeVideoPage() {
  return (
    location.hostname.includes("primevideo.com") ||
    (location.hostname.includes("amazon.") && location.pathname.includes("/gp/video/"))
  );
}

function isYouTubePage() {
  return location.hostname.includes("youtube.com") || location.hostname.includes("youtu.be");
}

function findPrimeVideoViewportHost() {
  const fullscreenElement = getFullscreenElement();
  const scope = fullscreenElement || document;
  const candidates = uniqueElements([
    scope.querySelector?.("[data-testid='web-player']"),
    scope.querySelector?.("[data-testid='dv-web-player']"),
    scope.querySelector?.("[class*='webPlayer']"),
    scope.querySelector?.("[class*='dv-player']"),
    scope.querySelector?.("[class*='atvwebplayersdk']"),
    findVideoViewportHost()
  ]);

  return candidates.find((candidate) => {
    const rect = candidate.getBoundingClientRect();
    return rect.width > window.innerWidth * 0.55 && rect.height > window.innerHeight * 0.45;
  }) ?? null;
}

function findPrimeFullscreenOverlayHosts(videoHost) {
  const fullscreenElement = getFullscreenElement();
  if (!fullscreenElement) {
    return [];
  }

  const candidateElements = [
    ...fullscreenElement.children,
    ...fullscreenElement.querySelectorAll(".fpqiyer.fh13lop"),
    ...fullscreenElement.querySelectorAll("[class*='fpqiyer'][class*='fh13lop']"),
    ...fullscreenElement.querySelectorAll("[class*='f102imk2']"),
    ...fullscreenElement.querySelectorAll("[class*='f124tp54']"),
    ...fullscreenElement.querySelectorAll("[class*='f3w9jrr']"),
    ...fullscreenElement.querySelectorAll("[class*='f10ec4mb3']"),
    ...fullscreenElement.querySelectorAll("[class*='f1oc4mb3']"),
    ...fullscreenElement.querySelectorAll("[class*='f1jovyhs']"),
    ...fullscreenElement.querySelectorAll("[class*='fzu5eck']"),
    ...fullscreenElement.querySelectorAll("[class*='f19vh6ps']"),
    ...fullscreenElement.querySelectorAll("[class*='atvwebplayersdk-']"),
    ...fullscreenElement.querySelectorAll("[class*='controls'], [class*='Controls'], [class*='control'], [class*='Control']"),
    ...fullscreenElement.querySelectorAll("[class*='overlay'], [class*='Overlay'], [class*='chrome'], [class*='Chrome']"),
    ...fullscreenElement.querySelectorAll("[role='slider'], [aria-valuenow], button")
  ];
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return uniqueElements(candidateElements.map((element) => {
    let host = element;

    while (host && host !== fullscreenElement) {
      const rect = host.getBoundingClientRect();
      const style = window.getComputedStyle(host);
      const className = String(host.className ?? "");
      const isPrimePlayerLayer =
        className.includes("fpqiyer") ||
        className.includes("fh13lop") ||
        className.includes("f102imk2") ||
        className.includes("f124tp54") ||
        className.includes("f3w9jrr") ||
        className.includes("f10ec4mb3") ||
        className.includes("f1oc4mb3") ||
        className.includes("f1jovyhs") ||
        className.includes("fzu5eck") ||
        className.includes("f19vh6ps") ||
        className.includes("atvwebplayersdk-") ||
        Boolean(host.querySelector?.("[class*='atvwebplayersdk-title-text']")) ||
        Boolean(host.querySelector?.("[class*='atvwebplayersdk-tick-mark-mask']")) ||
        Boolean(host.querySelector?.("[class*='atvwebplayersdk-playpause-button']"));
      const isOverlayLayer =
        host !== videoHost &&
        !videoHost.contains(host) &&
        (isPrimePlayerLayer || !host.contains(videoHost)) &&
        host.id !== ROOT_ID &&
        rect.width > viewportWidth * 0.55 &&
        (isPrimePlayerLayer || rect.height < viewportHeight * 0.5) &&
        (isPrimePlayerLayer || style.position === "absolute" || style.position === "fixed" || host.parentElement === fullscreenElement) &&
        (isPrimePlayerLayer || rect.top < viewportHeight * 0.2 || rect.bottom > viewportHeight * 0.72);

      if (isOverlayLayer) {
        return host;
      }

      host = host.parentElement;
    }

    return null;
  }));
}

function findPrimeFullscreenScrubberHosts() {
  const fullscreenElement = getFullscreenElement();
  if (!fullscreenElement) {
    return [];
  }

  return uniqueElements([
    ...fullscreenElement.querySelectorAll("[class*='atvwebplayersdk-tick-mark-mask']"),
    ...fullscreenElement.querySelectorAll("[class*='f1jovyhs']"),
    ...fullscreenElement.querySelectorAll("[class*='fzu5eck']"),
    ...fullscreenElement.querySelectorAll("[class*='f19vh6ps']")
  ].filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > window.innerWidth * 0.4;
  }));
}

function findVideoViewportHost() {
  const video = document.querySelector("video");
  if (!video) {
    return null;
  }

  const viewportArea = window.innerWidth * window.innerHeight;
  let best = null;
  let bestArea = 0;
  let element = video.parentElement;

  while (element && element !== document.body && element !== document.documentElement) {
    const rect = element.getBoundingClientRect();
    const area = rect.width * rect.height;
    const style = window.getComputedStyle(element);
    const isViewportLayer =
      area > viewportArea * 0.45 &&
      rect.width > window.innerWidth * 0.6 &&
      (style.position === "fixed" || style.position === "absolute" || style.position === "relative");

    if (isViewportLayer && area >= bestArea) {
      best = element;
      bestArea = area;
    }

    element = element.parentElement;
  }

  return best;
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function startDrag(event) {
  if (event.button !== 0 || state.layoutMode === LAYOUT_DOCKED || event.target.closest("button")) {
    return;
  }

  const root = document.getElementById(ROOT_ID);
  if (!root) {
    return;
  }

  const rect = root.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  event.currentTarget.setPointerCapture(event.pointerId);

  const onMove = (moveEvent) => {
    const nextX = clamp(moveEvent.clientX - offsetX, 8, window.innerWidth - rect.width - 8);
    const nextY = clamp(moveEvent.clientY - offsetY, 8, window.innerHeight - rect.height - 8);
    state.position = { x: nextX, y: nextY };
    root.style.left = `${nextX}px`;
    root.style.top = `${nextY}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
  };

  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp, { once: true });
}

function bindGlobalKeyboardGuards() {
  document.addEventListener("keydown", guardSuguKeyboardEvent);
  document.addEventListener("keyup", guardSuguKeyboardEvent);
  document.addEventListener("keypress", guardSuguKeyboardEvent);
}

function guardSuguKeyboardEvent(event) {
  if (!isSuguTextInput(document.activeElement)) {
    return;
  }

  lastKeyboardInputAt = Date.now();
  event.stopImmediatePropagation();
}

function stopKeyboardEvent(event) {
  lastKeyboardInputAt = Date.now();
  event.stopImmediatePropagation();
}

function restoreInputFocusAfterKeyboard(input) {
  window.setTimeout(() => {
    if (Date.now() - lastKeyboardInputAt > 250 || document.activeElement === input) {
      return;
    }

    if (!document.contains(input) || !document.getElementById(ROOT_ID)?.contains(input)) {
      return;
    }

    input.focus({ preventScroll: true });
  }, 0);
}

function isSuguTextInput(element) {
  return element?.classList?.contains("sugu-input") || false;
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response ?? { ok: false, error: "拡張機能の応答がありません。" });
    });
  });
}

function createIconButton(label, text, onClick) {
  const button = createElement("button", {
    className: "sugu-icon-button",
    text,
    attributes: {
      type: "button",
      title: label,
      "aria-label": label
    }
  });
  button.addEventListener("pointerdown", (event) => event.stopPropagation());
  button.addEventListener("click", onClick);
  return button;
}

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text !== undefined) {
    element.textContent = options.text;
  }
  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      element.setAttribute(key, value);
    }
  }
  if (options.children) {
    element.append(...options.children);
  }
  return element;
}

function cleanSelection(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "")
    .trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uniqueElements(elements) {
  return [...new Set(elements.filter(Boolean))];
}
