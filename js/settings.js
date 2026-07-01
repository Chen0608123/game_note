import { getCurrentUser, signOut } from "./auth.js";
import {
  DEFAULT_THEME,
  getResolvedThemeMode,
  getThemeMode,
  resetThemeMode,
  setThemeMode,
} from "./theme.js";
import {
  DEFAULT_GAME_CARD_COLUMNS,
  DEFAULT_GAME_SORT_MODE,
  getGameCardColumns,
  getGameSortMode,
  resetGameCardColumns,
  resetGameSortMode,
  setGameCardColumns,
  setGameSortMode,
} from "./preferences.js";

const themeOptions = document.querySelectorAll("[name='themeMode']");
const themeValue = document.querySelector("#themeValue");
const resetThemeButton = document.querySelector("#resetThemeButton");
const cardColumnOptions = document.querySelectorAll("[name='gameCardColumns']");
const cardColumnValue = document.querySelector("#cardColumnValue");
const resetCardColumnsButton = document.querySelector("#resetCardColumnsButton");
const sortModeOptions = document.querySelectorAll("[name='gameSortMode']");
const sortModeValue = document.querySelector("#sortModeValue");
const resetSortModeButton = document.querySelector("#resetSortModeButton");
const userEmail = document.querySelector("#userEmail");
const logoutButton = document.querySelector("#logoutButton");

function renderTheme(theme) {
  themeOptions.forEach((option) => {
    option.checked = option.value === theme;
  });

  if (theme === "system") {
    const resolvedTheme = getResolvedThemeMode(theme) === "dark" ? "深色" : "淺色";
    themeValue.textContent = `跟隨系統（目前${resolvedTheme}）`;
    return;
  }

  themeValue.textContent = theme === "dark" ? "深色" : "淺色";
}

function renderCardColumns(columns) {
  cardColumnOptions.forEach((option) => {
    option.checked = Number(option.value) === columns;
  });

  cardColumnValue.textContent = `${columns} 個`;
}

function renderSortMode(sortMode) {
  sortModeOptions.forEach((option) => {
    option.checked = option.value === sortMode;
  });

  sortModeValue.textContent = sortMode === "title" ? "標題排序" : "最近更新";
}

async function initSettings() {
  const user = await getCurrentUser();
  userEmail.textContent = user?.email || "尚未登入";
  logoutButton.textContent = user ? "登出" : "前往登入";

  renderTheme(getThemeMode());
  renderCardColumns(getGameCardColumns());
  renderSortMode(getGameSortMode());

  themeOptions.forEach((option) => {
    option.addEventListener("change", () => {
      renderTheme(setThemeMode(option.value));
    });
  });

  resetThemeButton.addEventListener("click", () => {
    renderTheme(resetThemeMode());
  });

  cardColumnOptions.forEach((option) => {
    option.addEventListener("change", () => {
      renderCardColumns(setGameCardColumns(option.value));
    });
  });

  resetCardColumnsButton.addEventListener("click", () => {
    renderCardColumns(resetGameCardColumns());
  });

  sortModeOptions.forEach((option) => {
    option.addEventListener("change", () => {
      renderSortMode(setGameSortMode(option.value));
    });
  });

  resetSortModeButton.addEventListener("click", () => {
    renderSortMode(resetGameSortMode());
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      renderTheme(getThemeMode());
    });
  }

  logoutButton.addEventListener("click", async () => {
    if (user) {
      await signOut();
      window.location.href = "./login.html";
      return;
    }

    window.location.href = "./login.html?next=./settings.html";
  });
}

initSettings().catch((error) => {
  console.error(error);
  renderTheme(DEFAULT_THEME);
  renderCardColumns(DEFAULT_GAME_CARD_COLUMNS);
  renderSortMode(DEFAULT_GAME_SORT_MODE);
});
