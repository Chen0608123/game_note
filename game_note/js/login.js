import { getCurrentUser, signInWithEmail, signUpWithEmail } from "./auth.js";

const state = {
  mode: "login",
};

const elements = {
  form: document.querySelector("#authForm"),
  title: document.querySelector("#authTitle"),
  submitButton: document.querySelector("#authSubmitButton"),
  switchButton: document.querySelector("#authSwitchButton"),
  message: document.querySelector("#authMessage"),
};

function getNextUrl() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next || "./index.html";
}

function setMode(mode) {
  state.mode = mode;
  const isLogin = mode === "login";

  elements.title.textContent = isLogin ? "登入遊戲筆記" : "建立帳號";
  elements.submitButton.textContent = isLogin ? "登入" : "註冊";
  elements.switchButton.textContent = isLogin ? "還沒有帳號？建立一個" : "已有帳號？回到登入";
  elements.message.textContent = "";
}

function setBusy(isBusy, label = "處理中") {
  elements.submitButton.disabled = isBusy;

  if (isBusy) {
    elements.submitButton.dataset.originalText = elements.submitButton.textContent;
    elements.submitButton.textContent = label;
  } else if (elements.submitButton.dataset.originalText) {
    elements.submitButton.textContent = elements.submitButton.dataset.originalText;
  }
}

function showMessage(message, type = "info") {
  elements.message.textContent = message;
  elements.message.dataset.type = type;
}

elements.switchButton.addEventListener("click", () => {
  setMode(state.mode === "login" ? "signup" : "login");
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const email = formData.get("email").trim();
  const password = formData.get("password");

  if (!email || !password) {
    showMessage("請輸入 Email 和密碼。", "error");
    return;
  }

  setBusy(true, state.mode === "login" ? "登入中" : "註冊中");

  try {
    if (state.mode === "login") {
      await signInWithEmail(email, password);
      window.location.href = getNextUrl();
      return;
    }

    const result = await signUpWithEmail(email, password);

    if (result.session) {
      window.location.href = getNextUrl();
      return;
    }

    showMessage("註冊完成，請先到信箱確認 Email，再回來登入。");
    setMode("login");
  } catch (error) {
    showMessage(error.message || "登入操作失敗，請稍後再試。", "error");
  } finally {
    setBusy(false);
  }
});

getCurrentUser()
  .then((user) => {
    if (user) {
      window.location.href = getNextUrl();
    }
  })
  .catch(() => {});
