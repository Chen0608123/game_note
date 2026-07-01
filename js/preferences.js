export const DEFAULT_GAME_CARD_COLUMNS = 3;
export const DEFAULT_GAME_SORT_MODE = "recent";

const GAME_CARD_COLUMNS_KEY = "game-note-card-columns";
const GAME_SORT_MODE_KEY = "game-note-sort-mode";
const VALID_GAME_CARD_COLUMNS = new Set([2, 3, 4]);
const VALID_GAME_SORT_MODES = new Set(["recent", "title"]);

export function getGameCardColumns() {
  const savedColumns = Number(localStorage.getItem(GAME_CARD_COLUMNS_KEY));
  return VALID_GAME_CARD_COLUMNS.has(savedColumns) ? savedColumns : DEFAULT_GAME_CARD_COLUMNS;
}

export function setGameCardColumns(columns) {
  const nextColumns = Number(columns);

  if (!VALID_GAME_CARD_COLUMNS.has(nextColumns)) {
    return getGameCardColumns();
  }

  localStorage.setItem(GAME_CARD_COLUMNS_KEY, String(nextColumns));
  applyCardLayout();
  return nextColumns;
}

export function resetGameCardColumns() {
  localStorage.removeItem(GAME_CARD_COLUMNS_KEY);
  applyCardLayout();
  return DEFAULT_GAME_CARD_COLUMNS;
}

export function applyCardLayout() {
  document.documentElement.style.setProperty("--game-card-columns", getGameCardColumns());
}

export function getGameSortMode() {
  const savedSortMode = localStorage.getItem(GAME_SORT_MODE_KEY);
  return VALID_GAME_SORT_MODES.has(savedSortMode) ? savedSortMode : DEFAULT_GAME_SORT_MODE;
}

export function setGameSortMode(sortMode) {
  if (!VALID_GAME_SORT_MODES.has(sortMode)) {
    return getGameSortMode();
  }

  localStorage.setItem(GAME_SORT_MODE_KEY, sortMode);
  return sortMode;
}

export function resetGameSortMode() {
  localStorage.removeItem(GAME_SORT_MODE_KEY);
  return DEFAULT_GAME_SORT_MODE;
}

applyCardLayout();
