# LessBoard

[English](readme.md) | [正體中文](docs/readme.zh_TW.md)

LessBoard 是一個互動式留言板網站，專注於網路安全設計原則的實作與驗證。

LessBoard 基於「Stateless」和「Serverless」的設計理念。

本專案為 (113-2) 網路攻防實習 (2025 Spring) Practicum of Attacking and Defense of Network Security 課程的期中考試成果。

> **⚠️ 注意：這是一個「作業導向」的專案，在投入生產之前必須仔細評估其可靠性和安全性。**

## 🧾 實作功能

註冊、上傳頭貼、登錄、留言、刪除留言。

## 🔐 核心特色：Stateless 設計理念

與傳統登入系統不同，LessBoard 採用極端原教旨主義的無狀態設計：

- 伺服器完全「不維護 Session 狀態」，登入為「假的登入」，僅前端顯示登入畫面與快取資訊。
- 任何敏感操作（留言、刪除留言）都需再次輸入帳密，並經由 HTTPS + Basic Auth 傳送至 API 層。
- 每個請求都是原子且自足的，符合 HTTP 精髓。
- 雖然 Stateless，但實作了假的 CSRF token 與假的 Session 模擬其機制，以迷惑攻擊者並強化防禦策略。
  - 實作上，檢查 Session 和 CSRF Token 是否存在但不驗證其真實性。
- 通過 UI / UX 設計和快取登入資訊以改善使用者體驗，並在視覺上與使用體驗上模擬登入狀態。

這種設計：

- 沒有 Cookie 和 JWT 等資訊，使攻擊者無法劫持狀態，有效降低攻擊面（CSRF 幾乎不可能成立）。
- 每次驗證皆重新認證，提高爆破攻擊難度。
- 對資源導向開發模式更自然，更接近 RESTful 原意。

## 📡 API 一覽

以下為 API 方法設計，遵循 RESTful 原則：

- `POST /api/v1/users`: 使用者註冊
- `POST /api/v1/sessions`: 使用者登入（假的登入，前端自行快取）
- `GET /api/v1/users/{username}/avatar`: 取得使用者頭貼圖片
- `GET /api/v1/messages`: 取得所有留言（公開）
- `POST /api/v1/messages`: 發表留言（需驗證）
- `DELETE /api/v1/messages/{message_id}`: 刪除留言（需驗證）

## 🌐 雲端架構：Cloudflare 全鏈路 Serverless 設計

- Cloudflare Worker 託管前後端程式碼，處理靜態內容與所有 API 請求。
- Cloudflare KV 儲存使用者資料與留言。
- Cloudflare R2 儲存上傳圖片原檔。
- Cloudflare Images 負責圖片格式驗證、大小限制與清洗。

這種設計：

- 所有後端邏輯皆由 Cloudflare Worker 控制，不受跨源限制，具天然的 CORS 安全性。
- 前端與後端完全分離，前端無法直接存取後端資料庫，避免 SQL 注入風險。
- 不使用任何自行架設伺服器與資料庫，減少攻擊面與維護負擔。

## 🛡️ 其他安全設計與防禦手段

- 純 HTML / CSS / JavaScript 手工雕琢，完全不使用任何框架，以減少潛在依賴鏈漏洞，控制攻擊面。
- 所有輸入包括頭貼和留言皆通過嚴格的前後端「格式驗證」和「資料清洗」，所有輸出皆經適當轉義，降低 XSS 風險。
- 密碼使用 Bcrypt 加密，確保存儲安全。
