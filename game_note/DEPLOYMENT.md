# GitHub Pages 部署筆記

這份專案可以部署到 GitHub Pages。部署前請先確認 Supabase 已完成：

1. 在 Supabase SQL Editor 執行 `supabase-schema.sql`
2. 確認資料表有建立：
   - `games`
   - `notes`
   - `memories`
3. 確認 Storage bucket 有建立：
   - `game-media`
4. 到 Authentication > Providers 確認 Email 登入已啟用

## 本機預覽

不要直接雙擊 HTML。請用本機伺服器開啟。

可以雙擊：

```text
start.bat
```

然後打開：

```text
http://127.0.0.1:8000/index.html
```

## GitHub Pages 部署流程

1. 建立 GitHub repository
2. 把整個 `game_note` 資料夾內容推上去
3. 到 repository 的 Settings
4. 打開 Pages
5. Source 選擇 `Deploy from a branch`
6. Branch 選擇 `main`
7. Folder 選擇 `/root`
8. 儲存設定

完成後會得到類似這樣的網址：

```text
https://你的帳號.github.io/game_note/
```

## 重要提醒

目前 Supabase 權限已改成登入版。部署後使用者需要先登入，才會看到自己的遊戲資料。

若使用 GitHub Pages，之後可在 Supabase Authentication > URL Configuration 補上 GitHub Pages 網址，方便註冊確認信與登入跳轉使用。

正式使用前建議：

- 針對影片做大小限制或壓縮
- 定期檢查 Supabase Storage 用量
