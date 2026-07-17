import {
  addNote,
  deleteMemory,
  deleteNote,
  escapeHtml,
  formatDate,
  getGame,
  updateGame,
  updateMemory,
  updateNote,
  uploadGameCover,
  uploadMemory,
} from "./cloud-store.js";
import { requireUser, signOut } from "./auth.js";

const state = {
  gameId: new URLSearchParams(window.location.search).get("id"),
  game: null,
  user: null,
  noteSearch: "",
  memorySearch: "",
};

const PINNED_ITEMS_KEY = "game-note-pinned-items";

const elements = {
  detailPage: document.querySelector("#detailPage"),
  notFoundPanel: document.querySelector("#notFoundPanel"),
  pageTitle: document.querySelector("#pageTitle"),
  pageMeta: document.querySelector("#pageMeta"),
  coverPreview: document.querySelector("#coverPreview"),
  editCoverFileName: document.querySelector("#editCoverFileName"),
  gameEditForm: document.querySelector("#gameEditForm"),
  noteForm: document.querySelector("#noteForm"),
  memoryForm: document.querySelector("#memoryForm"),
  noteSummary: document.querySelector("#noteSummary"),
  memorySummary: document.querySelector("#memorySummary"),
  noteList: document.querySelector("#noteList"),
  memoryList: document.querySelector("#memoryList"),
  noteSearchInput: document.querySelector("#noteSearchInput"),
  memorySearchInput: document.querySelector("#memorySearchInput"),
  mediaPreview: document.querySelector("#mediaPreview"),
  mediaPreviewBody: document.querySelector("#mediaPreviewBody"),
  mediaPreviewTitle: document.querySelector("#mediaPreviewTitle"),
  mediaPreviewDescription: document.querySelector("#mediaPreviewDescription"),
  mediaPreviewClose: document.querySelector("#mediaPreviewClose"),
  notePreview: document.querySelector("#notePreview"),
  notePreviewTitle: document.querySelector("#notePreviewTitle"),
  notePreviewMedia: document.querySelector("#notePreviewMedia"),
  notePreviewContent: document.querySelector("#notePreviewContent"),
  notePreviewClose: document.querySelector("#notePreviewClose"),
  noteFilePicker: document.querySelector("#noteFilePicker"),
  noteVideoUrl: document.querySelector("#noteVideoUrl"),
  memoryFilePicker: document.querySelector("#memoryFilePicker"),
  memoryLinkUrl: document.querySelector("#memoryLinkUrl"),
  noteEditDialog: document.querySelector("#noteEditDialog"),
  noteEditForm: document.querySelector("#noteEditForm"),
  noteEditCancelButton: document.querySelector("#noteEditCancelButton"),
  noteEditCancelFooterButton: document.querySelector("#noteEditCancelFooterButton"),
  editNoteVideoUrlLabel: document.querySelector("#editNoteVideoUrlLabel"),
  memoryEditDialog: document.querySelector("#memoryEditDialog"),
  memoryEditForm: document.querySelector("#memoryEditForm"),
  memoryEditCancelButton: document.querySelector("#memoryEditCancelButton"),
  memoryEditCancelFooterButton: document.querySelector("#memoryEditCancelFooterButton"),
  editMemoryLinkUrlLabel: document.querySelector("#editMemoryLinkUrlLabel"),
  userEmail: document.querySelector("#userEmail"),
  logoutButton: document.querySelector("#logoutButton"),
};

function createIconCloseButton(label) {
  const button = document.createElement("button");
  button.className = "icon-button";
  button.type = "button";
  button.textContent = "x";
  button.setAttribute("aria-label", label);
  return button;
}

function createPanelActionButton(label) {
  const button = document.createElement("button");
  button.className = "button button-primary panel-action-button";
  button.type = "button";
  button.textContent = label;
  return button;
}

function moveFormToDialog({
  form,
  title,
  submitLabel,
  cancelLabel,
  closeLabel,
}) {
  const dialog = document.createElement("dialog");
  dialog.className = "modal create-dialog";

  const heading = form.closest(".workspace-panel")?.querySelector(".section-heading");
  const openButton = createPanelActionButton(title);
  heading?.insertAdjacentElement("afterend", openButton);

  form.classList.remove("inline-form", "memory-upload-form");
  form.classList.add("modal-panel", "create-modal-form");

  const header = document.createElement("header");
  const titleElement = document.createElement("h2");
  const closeButton = createIconCloseButton(closeLabel);
  titleElement.textContent = title;
  header.append(titleElement, closeButton);
  form.prepend(header);

  const submitButton = form.querySelector("[type='submit']");
  const footer = document.createElement("footer");
  const cancelButton = document.createElement("button");
  cancelButton.className = "button button-secondary";
  cancelButton.type = "button";
  cancelButton.textContent = cancelLabel;
  submitButton.textContent = submitLabel;
  footer.append(cancelButton, submitButton);
  form.append(footer);

  dialog.append(form);
  document.body.append(dialog);

  openButton.addEventListener("click", () => {
    dialog.showModal();
  });

  [closeButton, cancelButton].forEach((button) => {
    button.addEventListener("click", () => {
      dialog.close();
    });
  });

  return dialog;
}

elements.noteCreateDialog = moveFormToDialog({
  form: elements.noteForm,
  title: "新增筆記",
  submitLabel: "新增筆記",
  cancelLabel: "取消",
  closeLabel: "關閉新增筆記",
});

elements.memoryCreateDialog = moveFormToDialog({
  form: elements.memoryForm,
  title: "新增紀念",
  submitLabel: "上傳紀念",
  cancelLabel: "取消",
  closeLabel: "關閉新增紀念",
});

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
  elements.userEmail.textContent = state.user?.email || "尚未登入";
}

function renderNotFound() {
  elements.detailPage.hidden = true;
  elements.notFoundPanel.hidden = false;
}

function renderMedia(memory) {
  if (memory.media_type === "link") {
    return `
      <button class="memory-media-button" type="button" data-preview-memory="${escapeHtml(memory.id)}">
        <div class="video-link-placeholder">連結</div>
        <span>開啟連結</span>
      </button>
    `;
  }

  if (memory.media_type === "video") {
    return `
      <button class="memory-media-button" type="button" data-preview-memory="${escapeHtml(memory.id)}">
        <video src="${escapeHtml(memory.public_url)}" muted></video>
        <span>播放影片</span>
      </button>
    `;
  }

  return `
    <button class="memory-media-button" type="button" data-preview-memory="${escapeHtml(memory.id)}">
      <img src="${escapeHtml(memory.public_url)}" alt="${escapeHtml(memory.name)}">
    </button>
  `;
}

function getNoteTypeLabel(noteType) {
  const labels = {
    text: "文字",
    image: "圖片",
    video: "影片",
  };

  return labels[noteType] || "文字";
}

function renderNoteMedia(note) {
  if (note.note_type === "image" && note.public_url) {
    return `<img src="${escapeHtml(note.public_url)}" alt="${escapeHtml(note.title)}">`;
  }

  if (note.note_type === "video" && note.public_url) {
    return `
      <div class="video-link-placeholder">影片</div>
      <span>${note.file_type === "external-url" ? "連結影片" : "影片筆記"}</span>
    `;
  }

  return "";
}

function getVideoEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (parsedUrl.hostname === "youtu.be") {
      const videoId = parsedUrl.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
  } catch {
    return "";
  }

  return "";
}

function renderVideoPreview(note) {
  if (!note.public_url) {
    return "";
  }

  if (note.file_type === "external-url") {
    const embedUrl = getVideoEmbedUrl(note.public_url);

    if (embedUrl) {
      return `<iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(note.title)}" allowfullscreen></iframe>`;
    }

    return `
      <div class="external-video-link">
        <a href="${escapeHtml(note.public_url)}" target="_blank" rel="noopener noreferrer">開啟影片連結</a>
      </div>
    `;
  }

  return `<video src="${escapeHtml(note.public_url)}" controls autoplay></video>`;
}

function openMediaPreview(memory) {
  if (memory.media_type === "link") {
    const embedUrl = getVideoEmbedUrl(memory.public_url);
    elements.mediaPreviewBody.innerHTML = embedUrl
      ? `<iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(memory.name)}" allowfullscreen></iframe>`
      : `
        <div class="external-video-link">
          <a href="${escapeHtml(memory.public_url)}" target="_blank" rel="noopener noreferrer">開啟連結</a>
        </div>
      `;
  } else {
    elements.mediaPreviewBody.innerHTML = memory.media_type === "video"
      ? `<video src="${escapeHtml(memory.public_url)}" controls autoplay></video>`
      : `<img src="${escapeHtml(memory.public_url)}" alt="${escapeHtml(memory.name)}">`;
  }

  elements.mediaPreviewTitle.textContent = memory.name;
  elements.mediaPreviewDescription.textContent = memory.description || "";
  elements.mediaPreviewDescription.hidden = !memory.description;
  elements.mediaPreview.showModal();
}

function closeMediaPreview() {
  elements.mediaPreview.close();
  elements.mediaPreviewBody.innerHTML = "";
  elements.mediaPreviewBody.classList.remove("is-fullscreen-expanded");
  resetPreviewZoom(elements.mediaPreviewBody);
  elements.mediaPreview.classList.remove("is-image-fullscreen");
  elements.mediaPreviewDescription.textContent = "";
}

function openNotePreview(note) {
  elements.notePreviewTitle.textContent = note.title;
  elements.notePreviewContent.textContent = note.content || "尚未填寫內容";
  elements.notePreviewMedia.innerHTML = "";

  if (note.note_type === "image" && note.public_url) {
    elements.notePreviewMedia.innerHTML = `<img src="${escapeHtml(note.public_url)}" alt="${escapeHtml(note.title)}">`;
  } else if (note.note_type === "video" && note.public_url) {
    elements.notePreviewMedia.innerHTML = renderVideoPreview(note);
  }

  elements.notePreviewMedia.hidden = !elements.notePreviewMedia.innerHTML;
  elements.notePreview.showModal();
}

function closeNotePreview() {
  elements.notePreview.close();
  elements.notePreviewMedia.innerHTML = "";
  elements.notePreviewMedia.classList.remove("is-fullscreen-expanded");
  resetPreviewZoom(elements.notePreviewMedia);
  elements.notePreview.classList.remove("is-image-fullscreen");
}

function resetPreviewZoom(container) {
  container.style.setProperty("--preview-zoom", "1");
}

function getPreviewZoom(container) {
  return Number(container.style.getPropertyValue("--preview-zoom")) || 1;
}

function setPreviewZoom(container, zoom) {
  const nextZoom = Math.min(Math.max(zoom, 1), 5);
  container.style.setProperty("--preview-zoom", nextZoom.toFixed(2));
}

function togglePreviewImageRatio(container, event) {
  const image = event.target.closest("img");

  if (!image || !container.contains(image)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const isExpanded = container.classList.toggle("is-fullscreen-expanded");
  container.closest("dialog")?.classList.toggle("is-image-fullscreen", isExpanded);
  resetPreviewZoom(container);
  image.setAttribute(
    "aria-label",
    isExpanded ? "圖片已全畫面放大，可用滾輪縮放" : "點擊圖片放大"
  );
}

function handlePreviewWheelZoom(container, event) {
  if (!container.classList.contains("is-fullscreen-expanded")) {
    return;
  }

  event.preventDefault();
  const zoomStep = event.deltaY < 0 ? 0.18 : -0.18;
  setPreviewZoom(container, getPreviewZoom(container) + zoomStep);
}

function openNoteEdit(note) {
  elements.noteEditForm.elements.editNoteId.value = note.id;
  elements.noteEditForm.elements.editNoteTitle.value = note.title;
  elements.noteEditForm.elements.editNoteContent.value = note.content || "";
  elements.noteEditForm.elements.editNoteVideoUrl.value = note.file_type === "external-url" ? note.public_url : "";
  elements.editNoteVideoUrlLabel.hidden = !(note.note_type === "video" && note.file_type === "external-url");
  elements.noteEditDialog.showModal();
}

function closeNoteEdit() {
  elements.noteEditDialog.close();
  elements.noteEditForm.reset();
}

function openMemoryEdit(memory) {
  elements.memoryEditForm.elements.editMemoryId.value = memory.id;
  elements.memoryEditForm.elements.editMemoryName.value = memory.name;
  elements.memoryEditForm.elements.editMemoryDescription.value = memory.description || "";
  elements.memoryEditForm.elements.editMemoryLinkUrl.value = memory.media_type === "link" ? memory.public_url : "";
  elements.editMemoryLinkUrlLabel.hidden = memory.media_type !== "link";
  elements.memoryEditDialog.showModal();
}

function closeMemoryEdit() {
  elements.memoryEditDialog.close();
  elements.memoryEditForm.reset();
}

function matchesKeyword(parts, keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return true;
  }

  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedKeyword);
}

function getPinnedItems() {
  try {
    return JSON.parse(localStorage.getItem(PINNED_ITEMS_KEY)) || {};
  } catch {
    return {};
  }
}

function getPinnedKey(type, id) {
  return `${state.gameId}:${type}:${id}`;
}

function isPinned(type, id) {
  return Boolean(getPinnedItems()[getPinnedKey(type, id)]);
}

function setPinned(type, id, pinned) {
  const pinnedItems = getPinnedItems();
  const key = getPinnedKey(type, id);

  if (pinned) {
    pinnedItems[key] = Date.now();
  } else {
    delete pinnedItems[key];
  }

  localStorage.setItem(PINNED_ITEMS_KEY, JSON.stringify(pinnedItems));
}

function sortPinnedFirst(items, type) {
  const pinnedItems = getPinnedItems();

  return [...items].sort((a, b) => {
    const aPinnedAt = pinnedItems[getPinnedKey(type, a.id)] || 0;
    const bPinnedAt = pinnedItems[getPinnedKey(type, b.id)] || 0;

    if (aPinnedAt || bPinnedAt) {
      return bPinnedAt - aPinnedAt;
    }

    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

function getVisibleNotes(notes) {
  return sortPinnedFirst(notes.filter((note) => matchesKeyword([
    note.title,
    note.content,
    getNoteTypeLabel(note.note_type),
  ], state.noteSearch)), "note");
}

function getVisibleMemories(memories) {
  return sortPinnedFirst(memories.filter((memory) => matchesKeyword([
    memory.name,
    memory.description,
    memory.media_type,
    memory.public_url,
  ], state.memorySearch)), "memory");
}

function render() {
  const game = state.game;

  if (!game) {
    renderNotFound();
    return;
  }

  elements.detailPage.hidden = false;
  elements.notFoundPanel.hidden = true;
  renderAccount();
  document.title = `${game.title} | 遊戲筆記`;
  elements.pageTitle.textContent = game.title;
  elements.pageMeta.textContent = `${game.platform} · ${game.status} · ${formatDate(game.updated_at)}`;
  elements.coverPreview.innerHTML = game.cover_url
    ? `<img src="${escapeHtml(game.cover_url)}" alt="${escapeHtml(game.title)}">`
    : `<span>未上傳遊戲圖片</span>`;
  elements.noteSummary.textContent = `${game.notes.length} 筆`;
  elements.memorySummary.textContent = `${game.memories.length} 個紀念`;

  const visibleNotes = getVisibleNotes(game.notes);
  const visibleMemories = getVisibleMemories(game.memories);

  elements.gameEditForm.elements.editTitle.value = game.title;
  elements.gameEditForm.elements.editPlatform.value = game.platform;
  elements.gameEditForm.elements.editStatus.value = game.status;

  elements.noteList.innerHTML = visibleNotes.length ? visibleNotes.map((note) => `
    <article class="list-item">
      <div class="card-actions">
        <button type="button" class="pin-action ${isPinned("note", note.id) ? "is-pinned" : ""}" data-pin-note="${escapeHtml(note.id)}">${isPinned("note", note.id) ? "已置頂" : "置頂"}</button>
      </div>
      <button class="note-preview-button" type="button" data-preview-note="${escapeHtml(note.id)}">
        <span class="note-type-pill">${getNoteTypeLabel(note.note_type)}</span>
        <strong>${escapeHtml(note.title)}</strong>
        <p>${escapeHtml(note.content || "尚未填寫內容")}</p>
        ${renderNoteMedia(note)}
      </button>
      <div class="item-actions">
        <button type="button" data-edit-note="${escapeHtml(note.id)}">編輯</button>
        <button type="button" data-delete-note="${escapeHtml(note.id)}">刪除</button>
      </div>
    </article>
  `).join("") : `<p class="empty-copy">${game.notes.length ? "找不到符合搜尋的筆記。" : "目前沒有筆記。"}</p>`;

  elements.memoryList.innerHTML = visibleMemories.length ? visibleMemories.map((memory) => `
    <article class="memory-card">
      <div class="card-actions">
        <button type="button" class="pin-action ${isPinned("memory", memory.id) ? "is-pinned" : ""}" data-pin-memory="${escapeHtml(memory.id)}">${isPinned("memory", memory.id) ? "已置頂" : "置頂"}</button>
      </div>
      ${renderMedia(memory)}
      <div class="memory-card-content">
        <strong>${escapeHtml(memory.name)}</strong>
        ${memory.description ? `<p>${escapeHtml(memory.description)}</p>` : ""}
        <div class="item-actions">
          <button type="button" data-edit-memory="${escapeHtml(memory.id)}">編輯</button>
          <button type="button" data-delete-memory="${escapeHtml(memory.id)}">刪除</button>
        </div>
      </div>
    </article>
  `).join("") : `<p class="empty-copy">${game.memories.length ? "找不到符合搜尋的紀念。" : "目前沒有已上傳紀念。"}</p>`;
}

async function refresh() {
  if (!state.gameId) {
    state.game = null;
    render();
    return;
  }

  state.game = await getGame(state.gameId);
  render();
}

elements.gameEditForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.gameEditForm);
  const title = formData.get("editTitle").trim();

  if (!state.game || !title) return;

  try {
    await updateGame(state.game.id, {
      title,
      platform: formData.get("editPlatform").trim() || "未設定平台",
      status: formData.get("editStatus"),
    });
    const coverFile = formData.get("editCoverFile");
    if (coverFile instanceof File && coverFile.size) {
      await uploadGameCover(state.game, coverFile);
      elements.gameEditForm.elements.editCoverFile.value = "";
      elements.editCoverFileName.textContent = "請選取檔案";
    }
    await refresh();
  } catch (error) {
    showError(error);
  }
});

elements.gameEditForm.elements.editCoverFile.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  elements.editCoverFileName.textContent = file ? file.name : "請選取檔案";
});

function updateNoteTypeFields() {
  const noteType = elements.noteForm.elements.noteType.value;
  const noteFile = elements.noteForm.elements.noteFile;
  const isFileNote = noteType === "image" || noteType === "video";

  elements.noteFilePicker.hidden = !isFileNote;
  elements.noteVideoUrl.hidden = noteType !== "video";
  noteFile.required = noteType === "image";
  noteFile.accept = noteType === "video" ? "video/*" : "image/*";

  if (!isFileNote) {
    noteFile.value = "";
  }

  if (noteType !== "video") {
    elements.noteVideoUrl.value = "";
  }
}

elements.noteForm.querySelectorAll("[name='noteType']").forEach((input) => {
  input.addEventListener("change", updateNoteTypeFields);
});

function updateMemoryTypeFields() {
  const memoryType = elements.memoryForm.elements.memoryType.value;
  const memoryFile = elements.memoryForm.elements.memoryFile;
  const isLinkMemory = memoryType === "link";

  elements.memoryFilePicker.hidden = isLinkMemory;
  elements.memoryLinkUrl.hidden = !isLinkMemory;
  memoryFile.required = !isLinkMemory;
  memoryFile.accept = memoryType === "video" ? "video/*" : "image/*";
  elements.memoryLinkUrl.required = isLinkMemory;

  if (isLinkMemory) {
    memoryFile.value = "";
  } else {
    elements.memoryLinkUrl.value = "";
  }
}

elements.memoryForm.querySelectorAll("[name='memoryType']").forEach((input) => {
  input.addEventListener("change", updateMemoryTypeFields);
});

elements.noteSearchInput.addEventListener("input", (event) => {
  state.noteSearch = event.target.value;
  render();
});

elements.memorySearchInput.addEventListener("input", (event) => {
  state.memorySearch = event.target.value;
  render();
});

elements.noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = elements.noteForm.querySelector("[type='submit']");
  const formData = new FormData(elements.noteForm);
  const title = formData.get("noteTitle").trim();
  const noteType = formData.get("noteType");
  const file = formData.get("noteFile");
  const videoUrl = formData.get("noteVideoUrl").trim();
  const hasFile = file instanceof File && file.size;
  const hasVideoUrl = Boolean(videoUrl);

  if (!state.game || !title) return;
  if (noteType === "image" && !hasFile) return;

  if (noteType === "video") {
    if (!hasFile && !hasVideoUrl) return;
    if (hasFile && hasVideoUrl) {
      alert("影片筆記請選擇上傳檔案或填寫連結其中一種。");
      return;
    }
  }

  setBusy(submitButton, true, "新增中");
  try {
    await addNote(state.game.id, {
      title,
      content: formData.get("noteContent").trim(),
      noteType,
      file,
      videoUrl,
    });
    elements.noteForm.reset();
    updateNoteTypeFields();
    elements.noteCreateDialog.close();
    await refresh();
  } catch (error) {
    showError(error);
  } finally {
    setBusy(submitButton, false);
  }
});

elements.memoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = elements.memoryForm.querySelector("[type='submit']");
  const formData = new FormData(elements.memoryForm);
  const file = formData.get("memoryFile");
  const memoryName = formData.get("memoryName").trim();
  const memoryDescription = formData.get("memoryDescription").trim();
  const memoryType = formData.get("memoryType");
  const memoryLinkUrl = formData.get("memoryLinkUrl").trim();
  const hasFile = file instanceof File && file.size;

  if (!state.game) return;
  if (memoryType === "link" && !memoryLinkUrl) return;
  if (memoryType !== "link" && !hasFile) return;

  setBusy(submitButton, true, "上傳中");
  try {
    await uploadMemory(state.game.id, {
      file,
      customName: memoryName,
      description: memoryDescription,
      memoryType,
      linkUrl: memoryLinkUrl,
    });
    elements.memoryForm.reset();
    updateMemoryTypeFields();
    elements.memoryCreateDialog.close();
    await refresh();
  } catch (error) {
    showError(error);
  } finally {
    setBusy(submitButton, false);
  }
});

elements.noteEditForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = elements.noteEditForm.querySelector("[type='submit']");
  const formData = new FormData(elements.noteEditForm);
  const noteId = formData.get("editNoteId");
  const note = state.game?.notes.find((item) => item.id === noteId);
  const title = formData.get("editNoteTitle").trim();
  const content = formData.get("editNoteContent").trim();
  const videoUrl = formData.get("editNoteVideoUrl").trim();

  if (!state.game || !note || !title) return;
  if (note.note_type === "video" && note.file_type === "external-url" && !videoUrl) return;

  setBusy(submitButton, true, "儲存中");
  try {
    await updateNote(note, state.game.id, { title, content, videoUrl });
    closeNoteEdit();
    await refresh();
  } catch (error) {
    showError(error);
  } finally {
    setBusy(submitButton, false);
  }
});

elements.memoryEditForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = elements.memoryEditForm.querySelector("[type='submit']");
  const formData = new FormData(elements.memoryEditForm);
  const memoryId = formData.get("editMemoryId");
  const memory = state.game?.memories.find((item) => item.id === memoryId);
  const name = formData.get("editMemoryName").trim();
  const description = formData.get("editMemoryDescription").trim();
  const linkUrl = formData.get("editMemoryLinkUrl").trim();

  if (!state.game || !memory || !name) return;
  if (memory.media_type === "link" && !linkUrl) return;

  setBusy(submitButton, true, "儲存中");
  try {
    await updateMemory(memory, state.game.id, { name, description, linkUrl });
    closeMemoryEdit();
    await refresh();
  } catch (error) {
    showError(error);
  } finally {
    setBusy(submitButton, false);
  }
});

document.addEventListener("click", async (event) => {
  if (!state.game) return;

  const noteId = event.target.dataset.deleteNote;
  const memoryId = event.target.dataset.deleteMemory;
  const editNoteId = event.target.dataset.editNote;
  const editMemoryId = event.target.dataset.editMemory;
  const pinNoteId = event.target.dataset.pinNote;
  const pinMemoryId = event.target.dataset.pinMemory;
  const notePreviewId = event.target.closest("[data-preview-note]")?.dataset.previewNote;
  const previewId = event.target.closest("[data-preview-memory]")?.dataset.previewMemory;

  try {
    if (pinNoteId) {
      setPinned("note", pinNoteId, !isPinned("note", pinNoteId));
      render();
      return;
    }

    if (pinMemoryId) {
      setPinned("memory", pinMemoryId, !isPinned("memory", pinMemoryId));
      render();
      return;
    }

    if (editNoteId) {
      const note = state.game.notes.find((item) => item.id === editNoteId);
      if (note) openNoteEdit(note);
      return;
    }

    if (editMemoryId) {
      const memory = state.game.memories.find((item) => item.id === editMemoryId);
      if (memory) openMemoryEdit(memory);
      return;
    }

    if (notePreviewId) {
      const note = state.game.notes.find((item) => item.id === notePreviewId);
      if (note) openNotePreview(note);
      return;
    }

    if (previewId) {
      const memory = state.game.memories.find((item) => item.id === previewId);
      if (memory) openMediaPreview(memory);
      return;
    }

    if (noteId) {
      const note = state.game.notes.find((item) => item.id === noteId);
      if (note) await deleteNote(note, state.game.id);
    } else if (memoryId) {
      const memory = state.game.memories.find((item) => item.id === memoryId);
      if (memory) await deleteMemory(memory, state.game.id);
    } else {
      return;
    }

    await refresh();
  } catch (error) {
    showError(error);
  }
});

elements.mediaPreviewClose.addEventListener("click", closeMediaPreview);

elements.mediaPreview.addEventListener("click", (event) => {
  if (event.target === elements.mediaPreview) {
    closeMediaPreview();
  }
});

elements.mediaPreviewBody.addEventListener("click", (event) => {
  togglePreviewImageRatio(elements.mediaPreviewBody, event);
});

elements.mediaPreviewBody.addEventListener("wheel", (event) => {
  handlePreviewWheelZoom(elements.mediaPreviewBody, event);
}, { passive: false });

elements.notePreviewClose.addEventListener("click", closeNotePreview);

elements.notePreview.addEventListener("click", (event) => {
  if (event.target === elements.notePreview) {
    closeNotePreview();
  }
});

elements.notePreviewMedia.addEventListener("click", (event) => {
  togglePreviewImageRatio(elements.notePreviewMedia, event);
});

elements.notePreviewMedia.addEventListener("wheel", (event) => {
  handlePreviewWheelZoom(elements.notePreviewMedia, event);
}, { passive: false });

elements.noteEditCancelButton.addEventListener("click", closeNoteEdit);
elements.noteEditCancelFooterButton.addEventListener("click", closeNoteEdit);
elements.noteEditDialog.addEventListener("click", (event) => {
  if (event.target === elements.noteEditDialog) {
    closeNoteEdit();
  }
});

elements.memoryEditCancelButton.addEventListener("click", closeMemoryEdit);
elements.memoryEditCancelFooterButton.addEventListener("click", closeMemoryEdit);
elements.memoryEditDialog.addEventListener("click", (event) => {
  if (event.target === elements.memoryEditDialog) {
    closeMemoryEdit();
  }
});

elements.logoutButton.addEventListener("click", async () => {
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
  await refresh();
}

init().catch(showError);
