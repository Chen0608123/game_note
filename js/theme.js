export const DEFAULT_THEME = "system";

const THEME_KEY = "game-note-theme";
const VALID_THEMES = new Set(["system", "light", "dark"]);
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

function getSystemTheme() {
  if (!window.matchMedia) {
    return "light";
  }

  return window.matchMedia(DARK_MODE_QUERY).matches ? "dark" : "light";
}

export function getThemeMode() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  return VALID_THEMES.has(savedTheme) ? savedTheme : DEFAULT_THEME;
}

export function getResolvedThemeMode(theme = getThemeMode()) {
  return theme === "system" ? getSystemTheme() : theme;
}

export function setThemeMode(theme) {
  if (!VALID_THEMES.has(theme)) {
    return getThemeMode();
  }

  localStorage.setItem(THEME_KEY, theme);
  applyTheme();
  return theme;
}

export function resetThemeMode() {
  localStorage.removeItem(THEME_KEY);
  applyTheme();
  return DEFAULT_THEME;
}

export function applyTheme() {
  const theme = getThemeMode();
  const resolvedTheme = getResolvedThemeMode(theme);

  document.documentElement.dataset.themeMode = theme;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

if (window.matchMedia) {
  window.matchMedia(DARK_MODE_QUERY).addEventListener("change", () => {
    if (getThemeMode() === "system") {
      applyTheme();
    }
  });
}

applyTheme();
