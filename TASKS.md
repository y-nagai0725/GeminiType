# `GeminiType` 開発タスク(工事の順番 Ver.2)

このドキュメントは、`GeminiType` を開発する作業の順番（タスク分解）をまとめたものです。
「機能（お部屋）ごと」に、BackendとFrontendをセットで開発していく**「垂直分業 (Vertical Slicing)」**の進め方を採用します。

---

## フェーズ1: 土台と管理画面（Backend + Frontend）

**目的:** アプリの「土台」を固め、管理者が「DB問題」を登録できる状態にする。

1.  **[Backend] プロジェクト初期設定**
    * `Node.js (Express)` プロジェクトを作成。
    * `MySQL` / `SQLite` への接続設定。
2.  **[Backend] データベース構築 (マイグレーション)**
    * 全5テーブル (`users`, `genres`, `problems`, `typing_sessions`, `session_problems`) を作成するスクリプトを準備・実行。
3.  **[Backend] ユーザー認証 API (JWT)**
    * `/register` (ユーザー登録), `/login` (ログイン), `/me` (認証確認) API を作成。
4.  **[Backend] 管理画面 API (CRUD)**
    * `is_admin` ユーザーのみがアクセスできる「門番」（ミドルウェア）を実装。
    * `/admin/genres` (ジャンルのCRUD) API を作成。
    * `/admin/problems` (問題文のCRUD) API を作成。
5.  **[Frontend] プロジェクト初期設定**
    * `Vue.js` プロジェクト作成、`vue-router` 基本設定。（レスポンシブ対応の設計も考慮）
6.  **[Frontend] ユーザー登録画面 (画面2) & ログイン画面 (画面3)**
    * 画面を作成し、`/register`, `/login` API と接続。JWTトークンを保存・管理する処理を実装。
7.  **[Frontend] (部品化) `TypingCore.vue` の「骨組み」作成**
    * 「管理画面の試し打ち」と「メインのタイピング」で**共通利用**する「タイピング部品」(`TypingCore.vue`) の作成を開始する。
    * まずは「1問だけ」を対象に、`wanakana` (日本語→ローマ字) の判定ロジックを実装する。
8.  **[Frontend] 管理画面 (画面9)**
    * ジャンル・問題のCRUD画面を作成し、Backend APIと接続。
    * （サブ機能）「試し打ち」ボタンを設置し、`TypingCore.vue` を**モーダル**で呼び出して「1問だけ」試せる機能を実装する。

---

## フェーズ2: メイン機能「タイピング」 (Backend + Frontend)

**目的:** アプリの「心臓部」であるタイピング機能を実装し、ゲスト/ログインユーザーが遊べる状態にする。

9.  **[Backend] タイピング機能 API**
    * `/typing/db` API を作成（**`count` パラメータ**を受け取り、指定問題数を返す）。
    * `/typing/gemini` API を作成（**`count` パラメータ**を受け取り、Geminiに指定問題数を作らせる）。
    * `/typing/result` API を作成（`average_wpm`, **`total_types`** 等を受け取り `typing_sessions` と `session_problems` に保存）。
10. **[Frontend] メインメニュー画面 (画面4) & AIお題入力画面 (画面5)**
    * 画面を作成。
11. **[Frontend] (NEW!) タイピング設定画面 (画面11)**
    * 画面を作成（**PC版に最適化**）。
    * 「問題数」「特殊モード」「音設定」を選択できるようにする。
    * 選択した設定を `localStorage` に保存・読込する処理を実装。
12. **[Frontend] (部品強化) `TypingCore.vue` の「完成」**
    * 「骨組み」を強化し、「**指定された問題数**（`localStorage` から読込）」を連続で実行できる「セッション機能」を実装する。
    * 進捗（n / 20問目）や、音のON/OFFもここで制御する。
13. **[Frontend] タイピング実行画面 (画面6)**
    * 画面を作成（**PC版に最適化**）。
    * `TypingCore.vue`（完成版）をメインに配置。
    * `[Backend] /typing/db`, `/typing/gemini` API と接続。
14. **[Frontend] セッション結果画面 (画面7)**
    * 画面を作成。「まとめ結果」を表示。
    * **「通常モード」**の場合のみ、`[Backend] /typing/result` API に結果を送信。
    * （サブ機能）「もう一度やる！」ボタンを実装（`localStorage` の `last_session` を使用）。

---

## フェーズ3: 周辺機能と仕上げ (Frontend + Sub-Functions)

**目的:** ユーザー体験を向上させる機能（履歴やグラフ）を追加し、アプリを完成させる。

15. **[Frontend] トップページ (画面1)**
    * LP（紹介ページ）を作成。「お試し」「登録」「ログイン」への導線を配置。
16. **[Backend] マイページ用 API**
    * `/mypage/stats` ( `typing_sessions` から **`総タイプ数(SUM)`** と **`総合平均WPM(AVG)`** を計算) API を作成。
    * `/mypage/sessions` ( `typing_sessions` の一覧を取得) API を作成。
    * `/mypage/sessions/:id` ( `session_problems` の詳細を取得) API を作成。
17. **[Frontend] マイページ (画面8)**
    * 画面を作成。
    * `stats` API と接続し、「総計」を表示。
    * `sessions` API と接続し、「セッション履歴（一覧）」を表示。
18. **[Frontend] セッション詳細画面 (画面10)**
    * 画面を作成。
    * `sessions/:id` API と接続し、「1問ごとの内訳」を表示。
19. **[サブ機能] グラフ描画**
    * `vue-chartjs` を導入。
    * マイページ(画面8)に、履歴データに基づいた成長グラフを描画する。
20. **[サブ機能] AIコメント**
    * セッション結果画面(画面7)に、Gemini APIによるコメント表示機能を追加する（お遊び）。