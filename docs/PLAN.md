# ポモドーロタイマーアプリ 実装計画

## 過去の計画: Portal方式YouTubeプレイヤー（完了）

### 目的
ページ遷移時にYouTubeプレイヤーを再ロードせず、シームレスに再生継続する

### 背景
- フローティングミニプレイヤーは実装済み（タイマー継続OK）
- ただしYouTubeは別々のiframeで管理されており、遷移時に再ロードが発生
- ユーザー体験向上のため、単一iframeでの実装に変更

### 問題点（v1実装）
- AppLayout内でYouTubePlayerを直接レンダリングしていた
- `isHomePage`が変わるとstyleが大きく変化し、Reactが再レンダリング
- `/log` → `/` 遷移時に`playerPosition`がnullになり、iframeが再作成される
- widgetidが1→2に変わる（再ロード発生）

### 解決策: createPortal + 固定コンテナ方式
1. `index.html`に`#youtube-player-root`を追加（Reactの外）
2. `createPortal`でYouTubePlayerをそこにレンダリング
3. CSSクラスで位置切り替え（DOM再作成なし）
4. iframeは一度作成されたら破棄されない

### 実装ステップ

#### Step 1: index.html修正
- [x] `#youtube-player-root` div追加

#### Step 2: index.css修正
- [x] `.youtube-position-home` / `.youtube-position-mini` / `.youtube-position-hidden` クラス追加

#### Step 3: YouTubePlayerPortal.tsx新規作成
- [x] `createPortal`でbody直下に描画
- [x] CSSクラスで位置制御

#### Step 4: AppLayout.tsx修正
- [x] YouTubePlayer直接レンダリングを削除
- [x] YouTubePlayerPortal使用に変更

#### Step 5: ビルド・動作確認
- [x] TypeScriptエラーなし
- [x] ビルド成功
- [x] 両方向遷移でwidgetid=1維持確認

---

## 変更対象ファイル

| ファイル | 操作 | 内容 |
|----------|------|------|
| `app/index.html` | 編集 | `#youtube-player-root` div追加 |
| `app/src/index.css` | 編集 | 位置制御CSSクラス追加 |
| `app/src/components/YouTube/YouTubePlayerPortal.tsx` | 新規 | Portal経由描画コンポーネント |
| `app/src/components/YouTube/index.ts` | 編集 | エクスポート追加 |
| `app/src/layouts/AppLayout.tsx` | 編集 | Portal使用に変更 |

---

## 完了条件

- [x] `/`でタイマー開始後、`/log`に遷移してもYouTube再ロードなし（widgetid維持）
- [x] `/log`でミニプレイヤーにYouTubeが小さく表示される
- [x] `/`に戻ってもYouTube再ロードなし（widgetid維持）
- [x] 音声が途切れずに継続する
- [x] ビルド成功

### 追加修正（2024/12/04）
初回実装後、`/log` → `/` 遷移時にYouTubeがリロードされる問題が残っていた。

**原因**: Reactの再レンダリング時にcontainerRef.currentが新しいDOMを指すため、iframeが再作成されていた。

**解決策**: YouTubePlayerPortalを完全にReact外で管理するように変更：
- グローバル変数でプレイヤーインスタンス、コンテナ、videoIdを管理
- DOM操作でコンテナを作成・更新
- Reactコンポーネントは状態監視とDOM更新のトリガーのみ担当

### 追加修正（2024/12/04 #2）
リロード時にYouTubeが「読み込み中」のまま止まる問題を修正。

**原因**: `onReady`コールバック内でタイマー停止時に`pauseVideo()`を呼ぶと、YouTubeがバッファリング状態で止まってしまう。

**解決策**:
- `onReady`時に`pauseVideo()`を呼ばない
- `autoplay=0`と`start=XX`パラメータで停止状態と再生位置を設定
- 再生時のみ`playVideo()`を呼ぶ

---

## 過去の計画: IndexedDB移行 + エクスポート/インポート機能（完了）

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
