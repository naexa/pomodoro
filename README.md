# Pomodoro Timer

集中と休憩を管理し、タスク達成をサポートするポモドーロタイマーアプリケーション

## 機能

- **ポモドーロタイマー**
  - 集中/休憩のサイクル管理
  - セット数設定（例：4セット = 1ラウンド）
  - 最終セット後の長め休憩
  - 休憩終了後の自動継続
  - 一時停止/再開機能
  - デスクトップ通知

- **YouTube BGM連携**
  - 集中時・休憩時で別のBGMを自動再生
  - 複数URLからランダム選択
  - タイマー停止時に自動停止

- **タスク管理**
  - タスクの追加/編集/削除
  - 完了チェック
  - フォーカスタスク選択（集中するタスクを明示）
  - ドラッグ&ドロップで並び替え

- **Contributionカレンダー**
  - GitHub風の達成可視化（1年分）
  - ポモドーロ完了数に応じた5段階の色の濃淡
  - 日付クリックで詳細ログ表示
  - 日別ログページでは年ごとの表示切替が可能

- **振り返り機能**
  - 朝の起動時に前日の振り返りを入力
  - タイマー画面に本日の意識ポイントを表示

- **名言表示**
  - タイマー実行中に偉人の名言を表示
  - 5分ごとにフェードイン/アウトで切り替え

## 技術仕様書

開発者向けの詳細な仕様書は [SPEC.md](./app/SPEC.md) を参照してください。

- API仕様
- データ構造（TypeScript型定義）
- コンポーネント設計
- 状態管理（カスタムフック）
- 拡張ポイント

## スクリーンショット

<!-- TODO: スクリーンショットを追加 -->

## 技術スタック

| 分類 | 技術 |
|------|------|
| フロントエンド | React 19 + TypeScript |
| スタイリング | Tailwind CSS v4 |
| バックエンド | Express.js (Node.js) |
| ビルドツール | Vite |
| データ永続化 | ローカルJSONファイル |

## 必要要件

- Node.js 18以上
- npm 9以上

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/pomodoro.git
cd pomodoro

# appディレクトリに移動
cd app

# 依存パッケージのインストール
npm install
```

## 初期データのセットアップ

`app/data/`ディレクトリに以下のファイルを作成してください：

### settings.json
```json
{
  "timer": {
    "focusDuration": 1500,
    "breakDuration": 300,
    "longBreakDuration": 900,
    "setsPerRound": 4
  },
  "youtube": {
    "focusUrls": [],
    "breakUrls": []
  }
}
```

### tasks.json
```json
[]
```

### calendar.json
```json
[]
```

### reflections.json
```json
[]
```

### taskHistory.json
```json
{}
```

### famous_saying.csv（名言データ）
```csv
author,saying
アルベルト・アインシュタイン,想像力は知識よりも重要だ。
スティーブ・ジョブズ,Stay hungry, stay foolish.
```

## 起動方法

```bash
cd app

# 開発サーバー起動（フロント+バックエンド同時）
npm start
```

ブラウザで http://localhost:5173 を開く

## 使い方

1. **初回起動時**: 振り返りフォームが表示されるので入力（スキップ可）
2. **タスク追加**: 「今日のタスク」セクションで入力して追加
3. **フォーカス選択**: タスクの「★」をクリックして集中するタスクを選択
4. **YouTube設定**: 「設定」から集中用/休憩用のYouTube URLを登録
5. **タイマー開始**: 「開始」ボタンでポモドーロ開始
6. **タスク完了**: チェックボックスで完了マーク → カレンダーに反映
7. **日別ログ**: カレンダーの日付クリックで過去の記録を確認

## タイマー設定

⚙ 時間設定から以下をカスタマイズ可能：

- **集中時間**: デフォルト25分
- **休憩時間**: デフォルト5分
- **長め休憩**: デフォルト15分（最終セット後）
- **セット数**: デフォルト4セット

プリセット：
- 標準（25/5/15分 x4セット）
- ロング（50/10/30分 x2セット）
- ショート（15/3/10分 x6セット）

## Contributionカレンダーの色

カレンダーのセルの色は**ポモドーロ完了数**で決まります（タスク完了数ではありません）。

| ポモドーロ数 | 色 | レベル |
|-------------|-----|-------|
| 0 | #ebedf0（薄いグレー） | 0 |
| 1 | #9be9a8（淡い緑） | 1 |
| 2 | #40c463（中間の緑） | 2 |
| 3〜4 | #30a14e（濃い緑） | 3 |
| 5以上 | #216e39（最も濃い緑） | 4 |

ポモドーロ1回 = 25分の集中時間。GitHubのコミット数のように「どれだけ集中したか」を可視化します。

## 開発コマンド

```bash
cd app
npm start      # フロント+バックエンド同時起動
npm run dev    # フロントエンドのみ
npm run server # バックエンドのみ
npm run build  # 本番ビルド
```

## ディレクトリ構造

```
pomodoro/
└── app/                         # アプリケーション本体
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── index.html
    ├── SPEC.md                  # 技術仕様書
    │
    ├── data/                    # データ永続化（.gitignore対象）
    │   ├── tasks.json
    │   ├── calendar.json
    │   ├── categories.json
    │   ├── reflections.json
    │   ├── settings.json
    │   ├── taskHistory.json
    │   └── famous_saying.csv
    │
    ├── server/                  # バックエンド
    │   └── index.ts
    │
    └── src/                     # フロントエンド
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api/                 # APIクライアント
        │   └── dataApi.ts
        ├── components/          # UIコンポーネント
        │   ├── Timer/
        │   ├── Tasks/
        │   ├── Category/
        │   ├── Calendar/
        │   ├── YouTube/
        │   ├── Reflection/
        │   └── Quote/
        ├── hooks/               # カスタムフック
        │   ├── useTasks.ts
        │   ├── useTimer.ts
        │   ├── useCalendar.ts
        │   └── useCategories.ts
        ├── pages/               # ページコンポーネント
        │   └── DailyLogPage.tsx
        ├── types/               # TypeScript型定義
        │   └── index.ts
        └── utils/               # ユーティリティ
            └── dateUtils.ts
```

## API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| GET/POST | `/api/tasks` | タスク一覧取得/追加 |
| PUT/DELETE | `/api/tasks/:id` | タスク更新/削除 |
| PUT | `/api/tasks/reorder` | タスク並び替え |
| GET | `/api/calendar` | カレンダーデータ取得 |
| PUT | `/api/calendar/:date` | 日付エントリー更新 |
| GET/POST | `/api/reflections` | 振り返り一覧取得/追加 |
| PUT | `/api/reflections/:id` | 振り返り更新 |
| GET/PUT | `/api/settings` | 設定取得/更新 |
| GET | `/api/daily-log/:date` | 日別ログ取得 |
| GET | `/api/quotes` | 名言一覧取得 |

## データの保存について

すべてのデータは`app/data/`ディレクトリ内のJSONファイルにローカル保存されます：

| ファイル | 内容 |
|----------|------|
| `tasks.json` | タスク一覧 |
| `calendar.json` | ポモドーロ・完了タスク数 |
| `reflections.json` | 振り返りログ |
| `settings.json` | タイマー・YouTube設定 |
| `taskHistory.json` | 完了タスク履歴 |
| `famous_saying.csv` | 名言データ（カスタマイズ可） |

クラウド同期やデータベースは使用していないため、データはこのPC内にのみ保存されます。

## 作者

naexa
