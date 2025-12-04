# ポモドーロタイマーアプリ 実装計画

## 現在の計画: IndexedDB移行 + エクスポート/インポート機能

### 目的
- サーバーレス（静的ホスティング）対応のためIndexedDBへ移行
- 手動エクスポート/インポートで端末間データ移行を可能に
- 既存データを保持したまま移行

### 背景
- Web公開時に静的ホスティング（Vercel/Netlify等）を使いたい
- 外部DBは漏洩リスクで避けたい
- 端末間同期は「あれば嬉しい」程度（必須ではない）
- LocalStorageは容量不安（5MB制限）→ IndexedDB（100MB+）を採用

---

## 現状の構造

```
React Components
    ↓
Custom Hooks (useTasks, useCalendar, etc.)
    ↓
dataApi.ts (fetch APIクライアント)
    ↓
Express.js Server (port 3001)
    ↓
app/data/*.json ファイル
```

**移行対象データ（7種類）:**
| データ | ファイル | 操作 |
|--------|----------|------|
| Tasks | tasks.json | CRUD |
| Calendar | calendar.json | Read/Update |
| Categories | categories.json | CRUD |
| Reflections | reflections.json | Create/Read/Update |
| Settings | settings.json | Read/Update |
| TaskHistory | taskHistory.json | Read/Create |
| Quotes | famous_saying.csv | Read only |

---

## 移行後の構造

```
React Components
    ↓
Custom Hooks (useTasks, useCalendar, etc.)
    ↓
dataApi.ts (IndexedDB操作に変更)
    ↓
IndexedDB (ブラウザ内蔵DB)
```

- **Express.jsサーバー不要**
- **静的ホスティングで動作**
- **データはブラウザに永続保存**

---

## 実装ステップ

### Step 0: CLAUDE.md 更新
- [x] タスク記録ルールをカスタムインストラクションに追加

### Step 0.5: 既存データエクスポート機能（現システム）
- [x] 現在のExpressサーバーにエクスポートAPIを追加
- [x] 全データをJSON形式でダウンロードできるようにする
- [x] ユーザーが既存データをバックアップ

### Step 1: IndexedDB ユーティリティ作成
- [x] `app/src/utils/indexedDB.ts` 新規作成
- [x] openDatabase, getAll, get, put, delete 関数実装
- [x] DBスキーマ定義（7つのオブジェクトストア）

### Step 2: dataApi.ts 書き換え
- [x] fetch('/api/...') → IndexedDB操作に置き換え
- [x] 全関数シグネチャは維持（フック側変更不要）

### Step 3: エクスポート/インポート機能追加
- [x] `app/src/utils/dataExport.ts` 新規作成
- [x] exportAllData(): 全データJSONダウンロード（dataApi.tsに実装済み）
- [x] importAllData(): JSONファイルから復元

### Step 4: データ管理UI追加
- [x] App.tsx ヘッダーにエクスポート/インポートボタン追加
- [x] インポート確認ダイアログ・成功/失敗通知

### Step 5: 名言データ埋め込み
- [x] `app/src/data/defaultQuotes.ts` 新規作成
- [x] CSVの内容をTypeScript定数として埋め込み

### Step 6: サーバー関連ファイル整理
- [x] app/server/ を app/_archive/server/ に移動
- [x] package.json からサーバー関連スクリプト・依存関係を削除

### Step 7: Vite設定調整
- [x] vite.config.ts からproxy設定削除

### Step 8: テスト・動作確認
- [x] 全機能の動作確認
- [x] エクスポート/インポートテスト
- [x] 静的ビルドで動作確認

---

## 変更対象ファイル一覧

| ファイル | 操作 | 内容 |
|----------|------|------|
| `CLAUDE.md` | 編集 | カスタムインストラクション追加 |
| `app/src/utils/indexedDB.ts` | 新規 | IndexedDBラッパー |
| `app/src/utils/dataExport.ts` | 新規 | エクスポート/インポート |
| `app/src/api/dataApi.ts` | 書換 | fetch → IndexedDB |
| `app/src/data/defaultQuotes.ts` | 新規 | 名言デフォルトデータ |
| `app/src/components/Settings/DataManagement.tsx` | 新規 | データ管理UI |
| `app/server/index.ts` | 削除 | サーバー不要 |
| `app/package.json` | 編集 | スクリプト整理 |
| `app/vite.config.ts` | 編集 | proxy削除 |

---

## 完了条件

- [x] IndexedDBでの全データ操作が動作する
- [x] サーバーなしで全機能が動作する
- [x] エクスポートでJSONダウンロードできる
- [x] インポートでデータ復元できる
- [x] 既存データが移行できる
- [x] `npm run build` の成果物が静的ホスティングで動作する
- [x] CLAUDE.mdにタスク記録ルールが追加されている

---

## 注意事項

- **既存のカスタムフックは変更最小限**（dataApi.tsの中身だけ変更）
- **型定義は維持**（types/index.tsは変更なし）
- **UIコンポーネントは基本変更なし**（DataManagement以外）

---

# 過去の計画（アーカイブ）

## 初期開発計画（完了）

### Phase 1-8: 基盤構築〜仕上げ
※ 初期開発は完了済み。詳細は docs/SPEC.md を参照。
