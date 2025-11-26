# `GeminiType` 開発タスク（進捗状況 Ver.3.0）

## フェーズ1: 土台と管理画面 (完了)
- [x] 1. [Backend] プロジェクト初期設定
- [x] 2. [Backend] データベース構築 (マイグレーション)
- [x] 3. [Backend] ユーザー認証 API
- [x] 4. [Backend] 管理画面 API (CRUD)
- [x] 5. [Backend] Yahoo! ルビ振り API (ひらがな化専用)
- [x] 6. [Frontend] プロジェクト初期設定
- [x] 7. [Frontend] ユーザー登録 & ログイン画面
- [x] 8. [Frontend] TypingCore.vue (v10 engine) 作成
- [x] 9. [Frontend] 管理画面 (CRUD, 検索, ページング, 試し打ち)

## フェーズ2: メイン機能「タイピング」 (完了)
- [x] 10. [Backend] タイピング機能 API (DB/Gemini/保存)
- [x] 11. [Frontend] メインメニュー画面
- [x] 12. [Frontend] タイピング設定画面 (localStorage連携)
- [x] 13. [Frontend] TypingCore.vue 完成 (連続出題, KPM計測, ミス集計)
- [x] 14. [Frontend] タイピング実行画面
- [x] 15. [Frontend] セッション結果画面 (リトライ機能)

## フェーズ3: 周辺機能と仕上げ (実装済み・お掃除待ち)
- [x] 16. [Frontend] トップページ (LP)
- [x] 17. [Backend] マイページ用 API
- [x] 18. [Frontend] マイページ (統計, グラフ, 履歴)
- [x] 19. [Frontend] セッション詳細画面 (詳細テーブル)
- [x] 20. [サブ機能] グラフ描画 (vue-chartjs)
- [x] 21. [サブ機能] AIコメント

## フェーズ4: 最終仕上げとお掃除 (Next!)
- [ ] **[Frontend] フェーズ3画面のリファクタリング**
    - `TopView`, `MyPageView`, `SessionDetailView`, `GrowthChart` のコード整理。
    - `utils/formatters.js` の作成と適用。
    - JSDocコメントの追加、エラー処理の統一。
- [ ] **[Backend/Frontend] バグ修正**
    - 辞書(`romanTypingParseDictionary.json`)に全角「？」を追加。
    - 漢数字がひらがなにならない問題の対策 (Yahoo APIの仕様調査 or クライアント側対応)。
- [ ] **[Design] UI/UXの最終調整** (お兄ちゃん担当)