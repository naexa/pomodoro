# ポモドーロタイマーアプリ 要件定義・実装計画

## 要件定義

### 1. ポモドーロタイマー機能
- 集中時間：25分、休憩：10分
- タイマーの開始/停止/リセット
- モード自動切り替え（集中→休憩→集中...）

### 2. YouTube音楽連携
- 集中時と休憩時で別のYouTube URLを設定
- 基本はiframe埋め込み（API不要）
- オプションでYouTube API対応（APIキー設定画面）

### 3. タスク管理
- タスクの追加/削除/編集
- 完了チェック機能
- 「今フォーカスするタスク」の選択・表示

### 4. Contributionカレンダー
- GitHubスタイルの色付きカレンダー
- タスク完了数で色が濃くなる
- 日ごとのログ蓄積

### 5. 振り返り機能
- 朝に前日の振り返りを入力
- タイマー下に表示して意識させる

### 6. データ保存・起動
- ローカルJSONファイルで永続化
- `npm start` でローカルサーバー起動

---

## 技術スタック

| 分類 | 技術 | 理由 |
|------|------|------|
| フロントエンド | React 18 + TypeScript | コンポーネント指向、型安全性 |
| スタイリング | Tailwind CSS | 迅速なUI構築、色分け容易 |
| バックエンド | Express.js (Node.js) | 軽量、JSONファイル操作に最適 |
| ビルドツール | Vite | 高速HMR、React+TS対応優秀 |
| 同時起動 | concurrently | フロント+バックエンド同時起動 |
| 日付操作 | date-fns | カレンダー表示、ログ管理 |

---

## ディレクトリ構造

```
pomodoro/
├── CLAUDE.md
├── README.md
├── PLAN.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
│
├── data/                        # JSONデータ永続化
│   ├── tasks.json
│   ├── calendar.json
│   ├── reflections.json
│   └── settings.json
│
├── server/                      # バックエンド
│   └── index.ts
│
└── src/                         # フロントエンド
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── Timer/
    │   ├── YouTube/
    │   ├── Tasks/
    │   ├── Calendar/
    │   └── Reflection/
    ├── hooks/
    ├── api/
    ├── types/
    └── utils/
```

---

## データ構造（JSONスキーマ）

### tasks.json
```json
{
  "tasks": [{
    "id": "uuid",
    "title": "タスク名",
    "completed": false,
    "isFocused": true,
    "createdAt": "ISO日時",
    "completedAt": null
  }]
}
```

### calendar.json
```json
{
  "entries": {
    "2025-11-27": {
      "completedCount": 5,
      "pomodoroCount": 3,
      "tasks": ["uuid"]
    }
  }
}
```

### reflections.json
```json
{
  "reflections": [{
    "id": "uuid",
    "date": "2025-11-27",
    "targetDate": "2025-11-26",
    "content": "振り返り内容",
    "createdAt": "ISO日時"
  }]
}
```

### settings.json
```json
{
  "timer": { "focusDuration": 1500, "breakDuration": 600 },
  "youtube": {
    "focusUrl": "",
    "breakUrl": "",
    "apiKey": null,
    "useApi": false
  }
}
```

---

## 実装フェーズ

### Phase 1: 基盤構築
- Vite + React + TypeScript セットアップ
- Tailwind CSS 導入
- Express サーバー構築
- 型定義・データファイル初期化

### Phase 2: タイマー機能
- useTimer フック実装
- TimerDisplay / TimerControls コンポーネント
- モード切り替え、通知機能

### Phase 3: タスク管理
- useTasks フック実装
- TaskList / TaskItem / TaskForm / FocusTask
- API連携でJSON永続化

### Phase 4: YouTube連携
- YouTubePlayer（iframe埋め込み）
- YouTubeSettings（URL/APIキー設定）
- モード連動で動画切り替え

### Phase 5: Contributionカレンダー
- ContributionCalendar（GitHubスタイル）
- タスク完了連動でカウント更新

### Phase 6: 振り返り機能
- ReflectionForm / ReflectionDisplay
- 朝の判定ロジック

### Phase 7: YouTube API対応（オプション）
- APIキー設定、IFrame API連携

### Phase 8: 仕上げ
- UI/UX改善、エラーハンドリング、README更新

---

## APIエンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| GET/POST | `/api/tasks` | タスク一覧取得/追加 |
| PUT/DELETE | `/api/tasks/:id` | タスク更新/削除 |
| GET/PUT | `/api/calendar/:date` | カレンダーデータ |
| GET/POST | `/api/reflections` | 振り返り |
| GET/PUT | `/api/settings` | 設定 |

---

## 開発コマンド

```bash
npm start      # フロント+バックエンド同時起動
npm run dev    # フロントエンドのみ
npm run server # バックエンドのみ
npm run build  # ビルド
```
