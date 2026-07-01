# 遊戲筆記網站雲端版

這是一個使用 Supabase 製作的遊戲筆記網站。使用者可以登入帳號，建立自己的遊戲庫，記錄遊戲筆記、遊戲圖片，以及遊戲紀念圖片。

資料會存到 Supabase Database，圖片會上傳到 Supabase Storage。網站本身可以部署到 GitHub Pages。

## 目前功能

- Email / 密碼登入
- 註冊帳號
- 登出帳號
- 每位使用者只能看到自己的遊戲資料
- 新增遊戲
- 遊戲庫列表
- 遊戲狀態篩選
- 遊戲搜尋
- 遊戲圖片上傳
- 遊戲圖片更換
- 獨立遊戲詳細頁
- 編輯遊戲名稱、平台、狀態
- 新增筆記
- 筆記可選擇文字、圖片或影片
- 影片筆記可貼連結或上傳檔案
- 刪除筆記
- 點擊筆記放大閱讀
- 上傳遊戲紀念圖片
- 上傳遊戲紀念影片
- 新增遊戲紀念連結
- 替遊戲紀念加入介紹文字
- 顯示已上傳紀念圖片牆
- 點擊紀念圖片放大預覽
- Supabase 雲端資料庫
- Supabase Storage 圖片儲存
- GitHub Pages 部署準備

## 檔案結構

```text
game_note/
├─ index.html
├─ login.html
├─ game-detail.html
├─ supabase-schema.sql
├─ start.bat
├─ DEPLOYMENT.md
├─ README.md
├─ game-notes-website-requirements.md
├─ .gitignore
├─ .nojekyll
├─ css/
│  └─ styles.css
├─ js/
│  ├─ supabase-config.js
│  ├─ auth.js
│  ├─ login.js
│  ├─ cloud-store.js
│  ├─ app.js
│  └─ detail.js
└─ data/
   └─ sample-games.json
```

## 主要頁面

### `login.html`

登入與註冊頁面。

功能：

- 輸入 Email
- 輸入密碼
- 登入既有帳號
- 建立新帳號
- 登入後導回原本想看的頁面

使用的程式：

- `js/login.js`
- `js/auth.js`
- `js/supabase-config.js`

### `index.html`

遊戲庫首頁。

功能：

- 顯示遊戲卡片
- 新增遊戲
- 上傳遊戲圖片
- 搜尋遊戲
- 依照狀態篩選遊戲
- 顯示遊戲庫摘要
- 顯示最近更新遊戲
- 顯示登入帳號
- 登出

使用的程式：

- `js/app.js`
- `js/auth.js`
- `js/cloud-store.js`
- `js/supabase-config.js`

### `game-detail.html`

單一遊戲詳細頁。

功能：

- 顯示遊戲圖片
- 顯示遊戲名稱、平台、狀態與更新時間
- 編輯遊戲基本資料
- 更換遊戲圖片
- 新增筆記
- 建立文字筆記
- 建立圖片筆記
- 建立影片筆記，支援影片連結或上傳檔案
- 刪除筆記
- 點擊筆記放大閱讀
- 上傳遊戲紀念圖片
- 上傳遊戲紀念影片或新增連結
- 編寫遊戲紀念介紹文字
- 顯示已上傳紀念圖片牆
- 點擊紀念圖片放大預覽
- 返回遊戲庫
- 顯示登入帳號
- 登出

使用的程式：

- `js/detail.js`
- `js/auth.js`
- `js/cloud-store.js`
- `js/supabase-config.js`

## JavaScript 檔案

### `js/supabase-config.js`

Supabase 連線設定。

內容包含：

- Supabase URL
- Supabase anon key
- Storage bucket 名稱
- Supabase client 建立

目前使用的 bucket：

```text
game-media
```

### `js/auth.js`

登入相關共用功能。

功能：

- 取得目前登入使用者
- 檢查是否已登入
- 未登入時導向 `login.html`
- Email / 密碼登入
- Email / 密碼註冊
- 登出

### `js/login.js`

登入頁面操作。

功能：

- 切換登入 / 註冊模式
- 送出登入表單
- 送出註冊表單
- 顯示登入錯誤或提示訊息
- 已登入時自動回到網站

### `js/cloud-store.js`

Supabase 資料存取層。

功能：

- 讀取遊戲列表
- 讀取單一遊戲
- 新增遊戲
- 更新遊戲
- 上傳遊戲圖片
- 新增筆記
- 上傳圖片筆記
- 上傳影片筆記
- 刪除筆記
- 上傳遊戲紀念圖片
- 刪除遊戲紀念圖片
- 更新遊戲修改時間

資料表：

- `games`
- `notes`
- `memories`

Storage：

- `game-media`

### `js/app.js`

首頁邏輯。

功能：

- 檢查登入狀態
- 載入遊戲庫
- 顯示遊戲卡片
- 顯示遊戲庫摘要
- 顯示最近更新遊戲
- 搜尋遊戲
- 篩選遊戲狀態
- 新增遊戲
- 上傳遊戲圖片
- 點擊卡片進入詳細頁
- 登出

### `js/detail.js`

遊戲詳細頁邏輯。

功能：

- 檢查登入狀態
- 載入單一遊戲資料
- 顯示遊戲圖片與基本資料
- 編輯遊戲基本資料
- 更換遊戲圖片
- 新增筆記
- 建立文字 / 圖片 / 影片筆記
- 刪除筆記
- 點擊筆記放大閱讀
- 上傳遊戲紀念圖片
- 顯示紀念圖片牆
- 點擊圖片放大預覽
- 登出

## CSS 檔案

### `css/styles.css`

整個網站的樣式檔。

包含：

- 全站色彩變數
- 背景格線
- 側邊欄
- 遊戲庫首頁排版
- 遊戲卡片
- 搜尋欄
- 篩選按鈕
- 摘要區塊
- 新增遊戲彈窗
- 登入頁
- 遊戲詳細頁
- 遊戲圖片預覽
- 表單樣式
- 筆記列表
- 筆記放大視窗
- 遊戲紀念圖片牆
- 圖片放大預覽
- 手機版響應式排版

## Supabase 設定

### 需要建立的項目

Database tables：

- `games`
- `notes`
- `memories`

Storage bucket：

- `game-media`

Authentication：

- Email 登入
- Email 註冊

### SQL 檔案

請到 Supabase SQL Editor 執行：

```text
supabase-schema.sql
```

這份 SQL 會建立：

- 資料表
- 欄位
- RLS 權限
- Storage bucket
- Storage 權限

目前的權限設計是登入版：

- 使用者只能讀取自己的遊戲
- 使用者只能新增自己的遊戲
- 使用者只能編輯自己的遊戲
- 使用者只能刪除自己的遊戲相關資料
- 上傳圖片會放在使用者自己的資料夾路徑底下

## 本機預覽

不要直接雙擊 HTML 檔案。

請雙擊：

```text
start.bat
```

接著打開：

```text
http://127.0.0.1:8000/login.html
```

或：

```text
http://127.0.0.1:8000/index.html
```

注意：

- 黑色視窗要保持開啟
- 關掉黑色視窗後網站就會連不上
- 要停止伺服器可以在黑色視窗按 `Ctrl + C`
- 如果出現 `Terminate batch job (Y/N)?`，輸入 `Y` 後按 Enter

## 登入測試

如果只是專題測試，可以先到 Supabase 關閉 Email 確認：

```text
Authentication > Sign In / Providers > Confirm email
```

關閉後記得按：

```text
Save changes
```

這樣註冊後可以直接登入。

如果要使用 Gmail 確認信，請到：

```text
Authentication > URL Configuration
```

本機測試時可以設定：

```text
Site URL:
http://127.0.0.1:8000

Redirect URLs:
http://127.0.0.1:8000/**
```

## 舊資料注意事項

目前已改成登入版。每位使用者登入後只會看到自己的遊戲、筆記與紀念內容。

如果先前已經執行過舊版 SQL，加入登入功能後請再執行一次：

```text
supabase-schema.sql
```

這會讓資料表補上：

- `user_id`
- `notes` 的筆記類型與檔案欄位
- 新的 RLS 權限
- 新的 Storage 權限

如果你已經有舊資料，啟用登入版後舊資料可能暫時看不到。請依照 `supabase-schema.sql` 最下面的註解，把舊資料歸到自己的 user id。

## GitHub Pages 部署

部署方式請參考：

```text
DEPLOYMENT.md
```

基本流程：

1. 建立 GitHub repository
2. 把整個 `game_note` 資料夾內容推上 GitHub
3. 到 repository 的 Settings
4. 打開 Pages
5. Source 選擇 `Deploy from a branch`
6. Branch 選擇 `main`
7. Folder 選擇 `/root`
8. 儲存設定

部署後會得到類似：

```text
https://你的帳號.github.io/game_note/
```

部署後請到 Supabase：

```text
Authentication > URL Configuration
```

加入 GitHub Pages 網址。

範例：

```text
Site URL:
https://你的帳號.github.io/game_note/

Redirect URLs:
https://你的帳號.github.io/game_note/**
```

## 修改網站後如何更新

如果是修改：

- 畫面
- 功能
- 排版
- 按鈕
- 程式碼

需要重新推到 GitHub，GitHub Pages 才會更新。

如果是在網站上新增：

- 遊戲
- 筆記
- 圖片

不用重新部署，因為資料會直接存在 Supabase。

## 其他檔案

### `start.bat`

本機啟動用批次檔。

用途：

- 開啟本機網站伺服器
- 預設網址是 `http://127.0.0.1:8000`

### `DEPLOYMENT.md`

GitHub Pages 部署筆記。

內容包含：

- 部署前 Supabase 檢查
- 本機預覽方式
- GitHub Pages 部署流程
- 部署後注意事項

### `game-notes-website-requirements.md`

專題需求與網站規劃文件。

### `data/sample-games.json`

範例遊戲資料。

目前網站主要使用 Supabase 雲端資料，這份檔案可作為資料格式參考。

### `.gitignore`

Git 忽略設定。

### `.nojekyll`

給 GitHub Pages 使用，避免 GitHub Pages 用 Jekyll 處理專案。

### `server.log`、`server-error.log`

本機測試時可能產生的暫存紀錄檔。它們不是網站主要功能檔案。

## 設定功能

目前新增 `settings.html` 設定頁。

第一項設定是網站背景顏色：

- 使用者可以在設定頁選擇背景顏色
- 選完後會立即套用到網站背景
- 顏色會存在目前使用的瀏覽器裡
- 下次再開首頁、詳細頁或登入頁時，會自動套用同一個背景顏色
- 可以按「恢復預設」回到原本的背景顏色

相關檔案：

- `settings.html`
- `js/settings.js`
- `js/theme.js`
- `css/styles.css`

## 目前限制

- 目前遊戲紀念主要以上傳圖片為主
- 影片如果要大量上傳，會比較吃 Supabase Storage 容量
- 如果正式公開使用，建議限制影片大小或先壓縮
- Supabase 免費方案有容量與流量限制，需要定期檢查用量
