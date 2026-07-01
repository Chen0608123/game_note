import {
  addNote,
  createGame,
  deleteGame,
  escapeHtml,
  formatDate,
  listGames,
  uploadGameCover,
} from "./cloud-store.js";
import { requireUser, signOut } from "./auth.js";
import { getGameSortMode } from "./preferences.js";

const titleCollator = new Intl.Collator("zh-Hant", {
  numeric: true,
  sensitivity: "base",
});

const demoGames = [
  {
    title: "星露谷物語",
    platform: "PC",
    status: "遊玩中",
    notes: [
      { title: "春季開局", content: "先擴充背包，再把每日體力用在耕種與釣魚。" },
    ],
  },
  {
    title: "薩爾達傳說 王國之淚",
    platform: "Switch",
    status: "暫停",
    notes: [
      { title: "探索規則", content: "看到高塔先解鎖地圖，再沿路標記洞窟與神廟。" },
    ],
  },
];

const state = {
  games: [],
  user: null,
  filter: "全部",
  search: "",
};

const elements = {
  emptyState: document.querySelector("#emptyState"),
  gameGrid: document.querySelector("#gameGrid"),
  searchInput: document.querySelector("#searchInput"),
  dialog: document.querySelector("#gameDialog"),
  form: document.querySelector("#gameForm"),
  coverFileName: document.querySelector("#coverFileName"),
  totalCount: document.querySelector("#totalCount"),
  playingCount: document.querySelector("#playingCount"),
  memoryCount: document.querySelector("#memoryCount"),
  noteCount: document.querySelector("#noteCount"),
  recentBox: document.querySelector("#recentBox"),
  userEmail: document.querySelector("#userEmail"),
  logoutButton: document.querySelector("#logoutButton"),
  addButtons: [
    document.querySelector("#addGameButton"),
    document.querySelector("#toolbarAddButton"),
    document.querySelector("#sideAddButton"),
  ],
  loadDemoButton: document.querySelector("#loadDemoButton"),
  cancelDialogButton: document.querySelector("#cancelDialogButton"),
  filterButtons: document.querySelectorAll(".filter-pill"),
};

function getVisibleGames() {
  const visibleGames = state.games.filter((game) => {
    const matchesFilter = state.filter === "全部" || game.status === state.filter;
    const keyword = state.search.trim().toLowerCase();
    const matchesSearch = !keyword || `${game.title} ${game.platform}`.toLowerCase().includes(keyword);

    return matchesFilter && matchesSearch;
  });

  return sortGames(visibleGames);
}

function sortGames(games) {
  const sortedGames = [...games];

  if (getGameSortMode() === "title") {
    return sortedGames.sort((a, b) => titleCollator.compare(a.title || "", b.title || ""));
  }

  return sortedGames.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
}

function setBusy(button, isBusy, label = "處理中") {
  if (!button) return;
  button.disabled = isBusy;
  if (isBusy) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
}

function showError(error) {
  console.error(error);
  alert(`雲端操作失敗：${error.message || error}`);
}

function renderAccount() {
  if (elements.userEmail) {
    elements.userEmail.textContent = state.user?.email || "尚未登入";
  }
}

function renderStats() {
  elements.totalCount.textContent = state.games.length;
  elements.playingCount.textContent = state.games.filter((game) => game.status === "遊玩中").length;
  elements.memoryCount.textContent = state.games.reduce((sum, game) => sum + game.memories.length, 0);
  elements.noteCount.textContent = state.games.reduce((sum, game) => sum + game.notes.length, 0);
}

function renderRecent() {
  if (!state.games.length) {
    elements.recentBox.innerHTML = `
      <strong>尚無最近開啟項目</strong>
      <span>新增遊戲後會顯示在這裡</span>
    `;
    return;
  }

  const latest = state.games[0];
  elements.recentBox.innerHTML = `
    <strong>${escapeHtml(latest.title)}</strong>
    <span>${escapeHtml(latest.platform)} · ${formatDate(latest.updated_at)}</span>
  `;
}

function renderGames() {
  const visibleGames = getVisibleGames();
  const hasGames = state.games.length > 0;

  elements.emptyState.hidden = hasGames;
  elements.gameGrid.hidden = !hasGames;

  if (!hasGames) {
    elements.searchInput.placeholder = "尚無遊戲可搜尋";
    elements.gameGrid.innerHTML = "";
    return;
  }

  elements.searchInput.placeholder = "搜尋遊戲名稱或平台";

  if (!visibleGames.length) {
    elements.gameGrid.innerHTML = `
      <article class="game-card">
        <strong>找不到符合條件的遊戲</strong>
        <p>調整搜尋字或切換狀態篩選。</p>
      </article>
    `;
    return;
  }

  elements.gameGrid.innerHTML = visibleGames.map((game) => `
    <article class="game-card" data-detail-url="./game-detail.html?id=${encodeURIComponent(game.id)}" tabindex="0" role="link" aria-label="查看 ${escapeHtml(game.title)} 詳情">
      <button class="game-card-delete" type="button" data-delete-game-id="${escapeHtml(game.id)}">刪除</button>
      <div class="game-card-cover ${game.cover_url ? "" : "is-empty"}">
        ${game.cover_url ? `<img src="${escapeHtml(game.cover_url)}" alt="${escapeHtml(game.title)}">` : `<span>未上傳圖片</span>`}
      </div>
      <div class="game-card-main">
        <strong>${escapeHtml(game.title)}</strong>
        <p>${escapeHtml(game.platform)} · ${formatDate(game.updated_at)}</p>
      </div>
      <div class="meta-row">
        <span>${escapeHtml(game.status)}</span>
        <span>${game.memories.length} 紀念</span>
        <span>${game.notes.length} 筆記</span>
      </div>
      <a class="button button-secondary card-button" href="./game-detail.html?id=${encodeURIComponent(game.id)}">查看詳情</a>
    </article>
  `).join("");
}

function render() {
  renderAccount();
  renderStats();
  renderRecent();
  renderGames();
}

async function refresh() {
  state.games = await listGames();
  render();
}

function openDialog() {
  if (typeof elements.dialog.showModal === "function") {
    elements.dialog.showModal();
  }
}

elements.addButtons.forEach((button) => {
  button?.addEventListener("click", openDialog);
});

elements.cancelDialogButton?.addEventListener("click", () => {
  elements.dialog.close();
});

elements.loadDemoButton?.addEventListener("click", async (event) => {
  setBusy(event.currentTarget, true, "匯入中");
  try {
    for (const demoGame of demoGames) {
      const game = await createGame(demoGame);
      for (const note of demoGame.notes) {
        await addNote(game.id, note);
      }
    }
    await refresh();
  } catch (error) {
    showError(error);
  } finally {
    setBusy(event.currentTarget, false);
  }
});

elements.searchInput?.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderGames();
});

elements.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    elements.filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderGames();
  });
});

elements.gameGrid?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-game-id]");

  if (deleteButton) {
    event.preventDefault();
    event.stopPropagation();
    handleDeleteGame(deleteButton.dataset.deleteGameId, deleteButton);
    return;
  }

  const card = event.target.closest("[data-detail-url]");

  if (!card) {
    return;
  }

  window.location.href = card.dataset.detailUrl;
});

elements.gameGrid?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  if (event.target.closest("button, a")) {
    return;
  }

  const card = event.target.closest("[data-detail-url]");

  if (!card) {
    return;
  }

  event.preventDefault();
  window.location.href = card.dataset.detailUrl;
});

async function handleDeleteGame(gameId, button) {
  const game = state.games.find((item) => item.id === gameId);

  if (!game) {
    return;
  }

  const confirmed = window.confirm(`確定要刪除「${game.title}」嗎？\n\n這會一起刪除該遊戲的筆記、紀念內容與圖片檔案。`);

  if (!confirmed) {
    return;
  }

  setBusy(button, true, "刪除中");

  try {
    await deleteGame(game);
    await refresh();
  } catch (error) {
    showError(error);
  } finally {
    setBusy(button, false);
  }
}

elements.form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = elements.form.querySelector("[type='submit']");
  const formData = new FormData(elements.form);
  const title = formData.get("title").trim();

  if (!title) return;

  setBusy(submitButton, true, "建立中");
  try {
    const game = await createGame({
      title,
      platform: formData.get("platform").trim() || "未設定平台",
      status: formData.get("status"),
    });
    const coverFile = formData.get("coverFile");
    if (coverFile instanceof File && coverFile.size) {
      await uploadGameCover(game, coverFile);
    }
    elements.form.reset();
    elements.coverFileName.textContent = "請選取檔案";
    elements.dialog.close();
    window.location.href = `./game-detail.html?id=${encodeURIComponent(game.id)}`;
  } catch (error) {
    showError(error);
  } finally {
    setBusy(submitButton, false);
  }
});

elements.form?.elements.coverFile?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  elements.coverFileName.textContent = file ? file.name : "請選取檔案";
});

elements.logoutButton?.addEventListener("click", async () => {
  try {
    await signOut();
    window.location.href = "./login.html";
  } catch (error) {
    showError(error);
  }
});

async function init() {
  state.user = await requireUser();

  if (!state.user) {
    return;
  }

  renderAccount();

  try {
    await refresh();
  } catch (error) {
    console.error(error);
    render();
    showError(error);
  }
}

init().catch(showError);
