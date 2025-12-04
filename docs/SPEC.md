# Pomodoro Timer - 技術仕様書

> **バージョン**: 1.0.0
> **最終更新**: 2024-12-04
> **対象読者**: 開発者

---

## 目次

1. [概要](#1-概要)
2. [画面構成](#2-画面構成)
3. [機能仕様](#3-機能仕様)
4. [データ構造](#4-データ構造)
5. [API仕様](#5-api仕様)
6. [コンポーネント設計](#6-コンポーネント設計)
7. [状態管理](#7-状態管理)
8. [依存関係](#8-依存関係)
9. [拡張ポイント](#9-拡張ポイント)

---

## 1. 概要

### 1.1 アプリケーション目的

集中と休憩を管理し、タスク達成をサポートするポモドーロタイマーアプリケーション。
GitHub風のContributionカレンダーで達成を可視化し、モチベーション維持を支援する。

### 1.2 主要機能一覧

| 機能 | 概要 |
|------|------|
| ポモドーロタイマー | 集中25分/休憩5分/長休憩15分のサイクル管理 |
| タスク管理 | 追加/編集/削除/完了/フォーカス選択/ドラッグソート |
| カテゴリ管理 | タスクの分類、ハッシュタグによる即時作成 |
| YouTube BGM | 集中時・休憩時で別BGMを自動再生 |
| Contributionカレンダー | GitHub風の達成可視化（1年分） |
| 振り返り機能 | 前日の反省を今日に活かす |
| 統計機能 | 日別/月別のカテゴリ別完了数集計 |
| 名言表示 | タイマー実行中に偉人の名言を表示 |

### 1.3 技術スタック

| 分類 | 技術 | バージョン |
|------|------|-----------|
| フロントエンド | React | 19.x |
| 言語 | TypeScript | 5.9.x |
| スタイリング | Tailwind CSS | 4.x |
| バックエンド | Express.js | 5.x |
| ビルドツール | Vite | 7.x |
| データ永続化 | ローカルJSONファイル | - |

---

## 2. 画面構成

### 2.1 ページ一覧

| パス | ページ | コンポーネント |
|------|--------|---------------|
| `/` | メイン画面 | `App.tsx` |
| `/daily-log/:date` | 日別ログ | `DailyLogPage.tsx` |

### 2.2 メイン画面レイアウト

```
┌─────────────────────────────────────────────────────────┐
│                    ヘッダー                              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │                 │  │                             │   │
│  │   タイマー      │  │      タスクリスト           │   │
│  │   (Timer)       │  │      (TaskList)             │   │
│  │                 │  │                             │   │
│  │   名言表示      │  │      - タスク追加フォーム   │   │
│  │   (QuoteDisplay)│  │      - フォーカスタスク     │   │
│  │                 │  │      - タスク一覧           │   │
│  ├─────────────────┤  │                             │   │
│  │   YouTube       │  │                             │   │
│  │   (YouTubeSection)│ │                             │   │
│  └─────────────────┘  └─────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│              Contributionカレンダー                      │
│              (ContributionCalendar)                     │
└─────────────────────────────────────────────────────────┘
```

### 2.3 日別ログページレイアウト

```
┌─────────────────────────────────────────────────────────┐
│  ← 戻る          2024-12-04           ← 前日 | 翌日 →  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │ サマリー: 完了タスク X件 / ポモドーロ Y回      │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 完了タスク一覧                                  │    │
│  │ - タスク1 [カテゴリ]                           │    │
│  │ - タスク2 [カテゴリ]                           │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 振り返り内容                                   │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ カテゴリ別統計（円グラフ + 横棒グラフ）        │    │
│  │ - 日別集計                                     │    │
│  │ - 月別集計（日別内訳付き）                     │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 年間カレンダー（YearlyCalendar）               │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 機能仕様

### 3.1 タイマー機能

#### 3.1.1 状態遷移図

```
                    ┌──────────┐
                    │  IDLE    │ ← 初期状態
                    │ (停止)   │
                    └────┬─────┘
                         │ start()
                         ▼
                    ┌──────────┐
         ┌─────────│  FOCUS   │←────────┐
         │         │ (集中中) │         │
         │         └────┬─────┘         │
         │              │ 時間終了       │
         │              ▼               │ 休憩終了
         │         ┌──────────┐         │ (自動継続)
         │         │  BREAK   │─────────┘
         │ reset() │ (休憩中) │
         │         └────┬─────┘
         │              │ 4セット目終了
         │              ▼
         │         ┌──────────┐
         └─────────│LONG_BREAK│
                   │(長休憩中)│
                   └──────────┘
```

#### 3.1.2 設定パラメータ

| パラメータ | デフォルト値 | 単位 | 説明 |
|-----------|-------------|------|------|
| `focusDuration` | 1500 | 秒 | 集中時間（25分） |
| `breakDuration` | 300 | 秒 | 休憩時間（5分） |
| `longBreakDuration` | 900 | 秒 | 長休憩時間（15分） |
| `setsPerRound` | 4 | 回 | 1ラウンドのセット数 |

#### 3.1.3 プリセット

| プリセット名 | 集中 | 休憩 | 長休憩 | セット数 |
|-------------|------|------|--------|---------|
| 標準 | 25分 | 5分 | 15分 | 4 |
| ロング | 50分 | 10分 | 30分 | 2 |
| ショート | 15分 | 3分 | 10分 | 6 |

#### 3.1.4 永続化（sessionStorage）

| キー | 値 | 用途 |
|-----|-----|------|
| `pomodoro_timeLeft` | number | 残り時間（秒） |
| `pomodoro_mode` | 'focus' \| 'break' | 現在のモード |
| `pomodoro_currentSet` | number | 現在のセット番号 |
| `pomodoro_isRunning` | boolean | 実行中フラグ |

### 3.2 タスク管理機能

#### 3.2.1 CRUD操作

| 操作 | API | 説明 |
|------|-----|------|
| 作成 | `POST /api/tasks` | 新規タスク追加 |
| 読取 | `GET /api/tasks` | 全タスク取得 |
| 更新 | `PUT /api/tasks/:id` | タスク編集 |
| 削除 | `DELETE /api/tasks/:id` | タスク削除 |

#### 3.2.2 フォーカス機能

- 1つのタスクのみフォーカス可能
- フォーカス設定時、他タスクのフォーカスは自動解除
- フォーカスタスクは画面上部に強調表示

#### 3.2.3 ドラッグソート

- `@dnd-kit/core` + `@dnd-kit/sortable` 使用
- ドラッグ完了時に `order` プロパティを更新
- `PUT /api/tasks/reorder` で並び順を永続化

#### 3.2.4 完了時の動作

1. `completed: true` に更新
2. `completedAt` にタイムスタンプ記録
3. カレンダーの `completedCount` をインクリメント
4. タスク履歴（`taskHistory.json`）に追加
5. `canvas-confetti` で紙吹雪アニメーション表示

### 3.3 カテゴリ機能

#### 3.3.1 カラーパレット

| 色名 | Tailwindクラス |
|------|---------------|
| blue | bg-blue-100, text-blue-700, border-blue-300 |
| green | bg-green-100, text-green-700, border-green-300 |
| red | bg-red-100, text-red-700, border-red-300 |
| yellow | bg-yellow-100, text-yellow-700, border-yellow-300 |
| purple | bg-purple-100, text-purple-700, border-purple-300 |
| pink | bg-pink-100, text-pink-700, border-pink-300 |
| indigo | bg-indigo-100, text-indigo-700, border-indigo-300 |
| teal | bg-teal-100, text-teal-700, border-teal-300 |
| orange | bg-orange-100, text-orange-700, border-orange-300 |
| cyan | bg-cyan-100, text-cyan-700, border-cyan-300 |

#### 3.3.2 ハッシュタグ作成

タスク入力時に `#カテゴリ名` と入力すると：
1. 既存カテゴリを検索
2. 存在しない場合は新規カテゴリを自動作成
3. タスクに `categoryId` を設定

### 3.4 YouTube BGM機能

#### 3.4.1 URL管理

| 種別 | 保存先 | 用途 |
|------|--------|------|
| 集中用 | `settings.youtube.focusUrls[]` | 集中モード時に再生 |
| 休憩用 | `settings.youtube.breakUrls[]` | 休憩モード時に再生 |

#### 3.4.2 動作仕様

- 複数URL登録時はランダム選択
- モード切替時に自動でURLを切替
- タイマー停止時は再生も停止
- `sessionStorage` で再生位置を保持

### 3.5 カレンダー機能

#### 3.5.1 Contributionカレンダー

- 過去52週間を表示（GitHub風）
- 横軸：週、縦軸：曜日（日〜土）
- セルクリックで日別ログページへ遷移

#### 3.5.2 色レベル定義

| レベル | ポモドーロ数 | 色コード | 説明 |
|--------|-------------|----------|------|
| 0 | 0 | #ebedf0 | 薄いグレー |
| 1 | 1 | #9be9a8 | 淡い緑 |
| 2 | 2 | #40c463 | 中間の緑 |
| 3 | 3〜4 | #30a14e | 濃い緑 |
| 4 | 5以上 | #216e39 | 最も濃い緑 |

#### 3.5.3 年間カレンダー

- 1年分（12ヶ月）を月ごとにグリッド表示
- 日別ログページで使用
- 年切替ボタンで過去の年を参照可能

### 3.6 振り返り機能

#### 3.6.1 入力タイミング

- 朝の初回起動時にモーダル表示
- 前日分の振り返りを入力
- スキップ可能

#### 3.6.2 データ構造

| フィールド | 説明 |
|-----------|------|
| `date` | 入力した日付（今日） |
| `targetDate` | 振り返り対象日（前日） |
| `content` | 振り返り文章 |

### 3.7 統計機能

#### 3.7.1 日別統計

- 指定日付のカテゴリ別完了タスク数
- 円グラフ + 横棒グラフで可視化
- 未分類タスク数も集計

#### 3.7.2 月別統計

- 指定月のカテゴリ別完了タスク数（合計）
- 日別内訳データ付き
- 日付順でソート

### 3.8 名言表示機能

#### 3.8.1 データソース

- `app/data/famous_saying.csv`
- CSV形式: `author,message`

#### 3.8.2 表示仕様

- 集中モード実行中のみ表示
- 5分間隔でフェードイン/アウト切替
- ランダム選択

---

## 4. データ構造

### 4.1 TypeScript型定義

```typescript
// タスク
interface Task {
  id: string;                    // UUID v4
  title: string;                 // タスク名
  completed: boolean;            // 完了フラグ
  isFocused: boolean;            // フォーカスフラグ
  createdAt: string;             // 作成日時（ISO 8601）
  completedAt: string | null;    // 完了日時（ISO 8601）
  order?: number;                // 並び順
  categoryId?: string;           // カテゴリID
}

// カテゴリ
interface Category {
  id: string;                    // UUID v4
  name: string;                  // カテゴリ名
  color: string;                 // 色名（Tailwind）
  order: number;                 // 並び順
  createdAt: string;             // 作成日時（ISO 8601）
}

// カレンダーエントリ
interface CalendarEntry {
  completedCount: number;        // 完了タスク数
  pomodoroCount: number;         // ポモドーロ完了数
  tasks: string[];               // 完了タスクID配列
}

// 振り返り
interface Reflection {
  id: string;                    // UUID v4
  date: string;                  // 入力日（YYYY-MM-DD）
  targetDate: string;            // 対象日（YYYY-MM-DD）
  content: string;               // 振り返り内容
  createdAt: string;             // 作成日時（ISO 8601）
}

// タイマー設定
interface TimerSettings {
  focusDuration: number;         // 集中時間（秒）
  breakDuration: number;         // 休憩時間（秒）
  longBreakDuration: number;     // 長休憩時間（秒）
  setsPerRound: number;          // セット数
}

// YouTube設定
interface YouTubeSettings {
  focusUrls: string[];           // 集中用URL配列
  breakUrls: string[];           // 休憩用URL配列
}

// カレンダーしきい値設定
interface CalendarThresholds {
  level1: number;                // レベル1しきい値
  level2: number;                // レベル2しきい値
  level3: number;                // レベル3しきい値
  level4: number;                // レベル4しきい値
}

// 全体設定
interface Settings {
  timer: TimerSettings;
  youtube: YouTubeSettings;
  calendarThresholds?: CalendarThresholds;
}

// タイマーモード
type TimerMode = 'focus' | 'break';

// 統計
interface CategoryStats {
  categoryId: string;
  categoryName: string;
  color: string;
  completedCount: number;
}

interface DailyStats {
  date: string;
  categories: CategoryStats[];
  uncategorizedCount: number;
}

interface MonthlyStats {
  month: string;                 // "YYYY-MM"
  categories: CategoryStats[];
  uncategorizedCount: number;
  dailyBreakdown: DailyStats[];
}
```

### 4.2 JSONファイル構造

#### 4.2.1 tasks.json

```json
{
  "tasks": [
    {
      "id": "uuid-v4",
      "title": "タスク名",
      "completed": false,
      "isFocused": true,
      "createdAt": "2024-12-04T10:00:00.000Z",
      "completedAt": null,
      "order": 0,
      "categoryId": "uuid-v4"
    }
  ]
}
```

#### 4.2.2 calendar.json

```json
{
  "entries": {
    "2024-12-04": {
      "completedCount": 5,
      "pomodoroCount": 3,
      "tasks": ["task-id-1", "task-id-2"]
    }
  }
}
```

#### 4.2.3 categories.json

```json
{
  "categories": [
    {
      "id": "uuid-v4",
      "name": "仕事",
      "color": "blue",
      "order": 0,
      "createdAt": "2024-12-04T10:00:00.000Z"
    }
  ]
}
```

#### 4.2.4 reflections.json

```json
{
  "reflections": [
    {
      "id": "uuid-v4",
      "date": "2024-12-04",
      "targetDate": "2024-12-03",
      "content": "振り返り内容",
      "createdAt": "2024-12-04T08:00:00.000Z"
    }
  ]
}
```

#### 4.2.5 settings.json

```json
{
  "timer": {
    "focusDuration": 1500,
    "breakDuration": 300,
    "longBreakDuration": 900,
    "setsPerRound": 4
  },
  "youtube": {
    "focusUrls": ["https://youtube.com/..."],
    "breakUrls": ["https://youtube.com/..."]
  },
  "calendarThresholds": {
    "level1": 1,
    "level2": 2,
    "level3": 3,
    "level4": 5
  }
}
```

#### 4.2.6 taskHistory.json

```json
{
  "tasks": {
    "2024-12-04": [
      { /* Task object */ }
    ]
  }
}
```

#### 4.2.7 famous_saying.csv

```csv
author,message
アルベルト・アインシュタイン,想像力は知識よりも重要だ。
スティーブ・ジョブズ,Stay hungry, stay foolish.
```

---

## 5. API仕様

### 5.1 エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/tasks` | 全タスク取得 |
| POST | `/api/tasks` | タスク作成 |
| PUT | `/api/tasks/:id` | タスク更新 |
| DELETE | `/api/tasks/:id` | タスク削除 |
| GET | `/api/categories` | 全カテゴリ取得 |
| POST | `/api/categories` | カテゴリ作成 |
| PUT | `/api/categories/:id` | カテゴリ更新 |
| DELETE | `/api/categories/:id` | カテゴリ削除 |
| GET | `/api/calendar` | カレンダーデータ取得 |
| PUT | `/api/calendar/:date` | カレンダー更新 |
| GET | `/api/reflections` | 全振り返り取得 |
| POST | `/api/reflections` | 振り返り作成 |
| PUT | `/api/reflections/:id` | 振り返り更新 |
| GET | `/api/settings` | 設定取得 |
| PUT | `/api/settings` | 設定更新 |
| GET | `/api/task-history` | 全タスク履歴取得 |
| GET | `/api/task-history/:date` | 日別タスク履歴取得 |
| POST | `/api/task-history/:date` | タスク履歴追加 |
| GET | `/api/daily-log/:date` | 日別ログ取得 |
| GET | `/api/stats/daily/:date` | 日別統計取得 |
| GET | `/api/stats/monthly/:month` | 月別統計取得 |
| GET | `/api/quotes` | 名言一覧取得 |
| GET | `/api/export` | 全データエクスポート |

### 5.2 エンドポイント詳細

#### GET /api/tasks

**レスポンス:**
```json
{
  "tasks": [Task, Task, ...]
}
```

#### POST /api/tasks

**リクエスト:**
```json
{
  "id": "uuid-v4",
  "title": "タスク名",
  "completed": false,
  "isFocused": false,
  "createdAt": "ISO 8601",
  "completedAt": null,
  "categoryId": "uuid-v4 (optional)"
}
```

**レスポンス:** 作成されたTaskオブジェクト

#### PUT /api/tasks/:id

**リクエスト:** `Partial<Task>`

**レスポンス:** 更新後のTaskオブジェクト

#### DELETE /api/tasks/:id

**レスポンス:**
```json
{ "success": true }
```

#### GET /api/daily-log/:date

**レスポンス:**
```json
{
  "date": "2024-12-04",
  "calendarEntry": CalendarEntry,
  "tasks": [Task, Task, ...],
  "reflection": Reflection | null
}
```

#### GET /api/stats/daily/:date

**レスポンス:**
```json
{
  "date": "2024-12-04",
  "categories": [
    {
      "categoryId": "uuid",
      "categoryName": "仕事",
      "color": "blue",
      "completedCount": 3
    }
  ],
  "uncategorizedCount": 1
}
```

#### GET /api/stats/monthly/:month

**パラメータ:** `:month` = "YYYY-MM"

**レスポンス:**
```json
{
  "month": "2024-12",
  "categories": [CategoryStats, ...],
  "uncategorizedCount": 5,
  "dailyBreakdown": [DailyStats, DailyStats, ...]
}
```

#### GET /api/export

**説明:** 全データをJSON形式でエクスポート。バックアップ用途。

**レスポンスヘッダー:**
- `Content-Type: application/json`
- `Content-Disposition: attachment; filename="pomodoro-backup-YYYY-MM-DD.json"`

**レスポンス:**
```json
{
  "version": 1,
  "exportedAt": "2024-12-04T10:00:00.000Z",
  "data": {
    "tasks": [Task, ...],
    "calendar": { "2024-12-04": CalendarEntry, ... },
    "categories": [Category, ...],
    "reflections": [Reflection, ...],
    "settings": Settings,
    "taskHistory": { "2024-12-04": [Task, ...], ... },
    "quotes": [{ "id": "1", "author": "...", "message": "..." }, ...]
  }
}
```

**フロントエンド:**
- `dataApi.ts` の `exportAllData()` 関数でダウンロード処理
- App.tsx ヘッダーに「データをエクスポート」ボタン配置

---

## 6. コンポーネント設計

### 6.1 コンポーネント階層図

```
App.tsx
├── ReflectionForm (モーダル)
├── Timer/
│   ├── Timer.tsx
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerControls.tsx
│   │   └── TimerSettings.tsx (モーダル)
│   └── QuoteDisplay.tsx
├── Tasks/
│   ├── TaskList.tsx
│   │   ├── TaskForm.tsx
│   │   ├── FocusTask.tsx
│   │   └── SortableTaskItem.tsx
│   │       └── TaskItem.tsx
│   └── CategoryManager.tsx (モーダル)
├── YouTube/
│   └── YouTubeSection.tsx
│       ├── YouTubePlayer.tsx
│       └── YouTubeSettings.tsx (モーダル)
├── Calendar/
│   └── ContributionCalendar.tsx
│       └── CalendarCell.tsx
└── Category/
    └── CategoryBadge.tsx

DailyLogPage.tsx
├── YearlyCalendar.tsx
│   └── CalendarCell.tsx
└── CategoryBadge.tsx
```

### 6.2 主要コンポーネント一覧

#### Timer.tsx

| Props | 型 | 説明 |
|-------|-----|------|
| focusDuration | number | 集中時間（秒） |
| breakDuration | number | 休憩時間（秒） |
| longBreakDuration | number | 長休憩時間（秒） |
| setsPerRound | number | セット数 |
| onModeChange | (mode: TimerMode) => void | モード変更コールバック |
| onPomodoroComplete | () => void | ポモドーロ完了コールバック |
| onRunningChange | (running: boolean) => void | 実行状態変更コールバック |
| onRoundComplete | () => void | ラウンド完了コールバック |

#### TaskList.tsx

| Props | 型 | 説明 |
|-------|-----|------|
| tasks | Task[] | タスク配列 |
| focusedTask | Task \| undefined | フォーカス中のタスク |
| categories | Category[] | カテゴリ配列 |
| onAdd | (title: string, categoryId?: string) => Promise<Task> | タスク追加 |
| onEdit | (id: string, updates: Partial<Task>) => Promise<void> | タスク編集 |
| onToggleComplete | (id: string) => Promise<void> | 完了切替 |
| onDelete | (id: string) => Promise<void> | タスク削除 |
| onSetFocus | (id: string) => Promise<void> | フォーカス設定 |
| onReorder | (tasks: Task[]) => Promise<void> | 並び替え |
| onCreateCategory | (name: string, color?: string) => Promise<Category> | カテゴリ作成 |

#### TaskItem.tsx

| Props | 型 | 説明 |
|-------|-----|------|
| task | Task | タスクオブジェクト |
| categories | Category[] | カテゴリ配列 |
| onToggleComplete | (id: string) => void | 完了切替 |
| onEdit | (id: string, updates: Partial<Task>) => void | 編集 |
| onDelete | (id: string) => void | 削除 |
| onSetFocus | (id: string) => void | フォーカス設定 |
| onCreateCategory | (name: string, color?: string) => Promise<Category> | カテゴリ作成 |

#### ContributionCalendar.tsx

| Props | 型 | 説明 |
|-------|-----|------|
| data | Record<string, CalendarEntry> | カレンダーデータ |
| thresholds | CalendarThresholds | 色しきい値 |
| onThresholdsChange | (thresholds: CalendarThresholds) => void | しきい値変更 |

#### YouTubeSection.tsx

| Props | 型 | 説明 |
|-------|-----|------|
| mode | TimerMode | 現在のタイマーモード |
| isTimerRunning | boolean | タイマー実行中フラグ |
| focusUrls | string[] | 集中用URL配列 |
| breakUrls | string[] | 休憩用URL配列 |
| onSettingsSave | (focusUrls: string[], breakUrls: string[]) => void | 設定保存 |

---

## 7. 状態管理

### 7.1 カスタムフック一覧

#### useTasks

```typescript
const {
  tasks,           // Task[] - 全タスク
  loading,         // boolean - 読込中フラグ
  focusedTask,     // Task | undefined - フォーカスタスク
  completedCount,  // number - 完了数
  pendingCount,    // number - 未完了数
  addTask,         // (title, categoryId?) => Promise<Task>
  editTask,        // (id, updates) => Promise<void>
  toggleComplete,  // (id) => Promise<void>
  removeTask,      // (id) => Promise<void>
  setFocusTask,    // (id) => Promise<void>
  reorderTasks,    // (tasks) => Promise<void>
  reload,          // () => Promise<void>
} = useTasks();
```

#### useTimer

```typescript
const {
  timeLeft,        // number - 残り時間（秒）
  isRunning,       // boolean - 実行中フラグ
  isPaused,        // boolean - 一時停止中フラグ
  mode,            // TimerMode - 現在のモード
  currentSet,      // number - 現在のセット番号
  totalSets,       // number - 総セット数
  start,           // () => void
  pause,           // () => void
  resume,          // () => void
  reset,           // () => void
  resetAll,        // () => void
  switchMode,      // (mode?) => void
} = useTimer(options);
```

#### useCategories

```typescript
const {
  categories,          // Category[] - 全カテゴリ
  loading,             // boolean - 読込中フラグ
  addCategory,         // (name, color?) => Promise<Category>
  editCategory,        // (id, updates) => Promise<void>
  removeCategory,      // (id) => Promise<void>
  getCategoryById,     // (id?) => Category | undefined
  getCategoryByName,   // (name) => Category | undefined
  searchCategories,    // (query) => Category[]
  reload,              // () => Promise<void>
} = useCategories();
```

#### useCalendar

```typescript
const {
  data,                // CalendarData - { entries: Record<date, CalendarEntry> }
  loading,             // boolean - 読込中フラグ
  getEntry,            // (date) => CalendarEntry | undefined
  incrementCompleted,  // (taskId) => Promise<void>
  incrementPomodoro,   // () => Promise<void>
  reload,              // () => Promise<void>
} = useCalendar();
```

### 7.2 データフロー図

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ useTasks │ │useTimer  │ │useCalendar│ │useCategories │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘    │
│       │            │            │              │             │
│       ▼            ▼            ▼              ▼             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    State                            │    │
│  │  tasks, timer, calendar, categories, settings       │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ Props / Callbacks
                           ▼
              ┌────────────────────────────┐
              │     Child Components       │
              │  Timer, TaskList, etc.     │
              └────────────┬───────────────┘
                           │ User Actions
                           ▼
              ┌────────────────────────────┐
              │       dataApi.ts           │
              │  fetch / create / update   │
              └────────────┬───────────────┘
                           │ HTTP
                           ▼
              ┌────────────────────────────┐
              │    Express Server          │
              │    server/index.ts         │
              └────────────┬───────────────┘
                           │ File I/O
                           ▼
              ┌────────────────────────────┐
              │    JSON Files (data/)      │
              │  tasks, calendar, etc.     │
              └────────────────────────────┘
```

---

## 8. 依存関係

### 8.1 本番依存パッケージ

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| react | ^19.2.0 | UIフレームワーク |
| react-dom | ^19.2.0 | React DOMレンダリング |
| react-router-dom | ^7.9.6 | ルーティング |
| @dnd-kit/core | ^6.3.1 | ドラッグ&ドロップ |
| @dnd-kit/sortable | ^10.0.0 | ソート機能 |
| @dnd-kit/utilities | ^3.2.2 | dnd-kitユーティリティ |
| canvas-confetti | ^1.9.4 | 紙吹雪アニメーション |
| cors | ^2.8.5 | CORS対応（Express） |
| express | ^5.1.0 | Webフレームワーク |

### 8.2 開発依存パッケージ

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| typescript | ^5.9.3 | TypeScript |
| vite | ^7.2.4 | ビルドツール |
| @vitejs/plugin-react | ^5.1.1 | Vite Reactプラグイン |
| tailwindcss | ^4.1.17 | CSSフレームワーク |
| @tailwindcss/postcss | ^4.1.17 | Tailwind PostCSS |
| postcss | ^8.5.6 | CSSトランスパイラ |
| autoprefixer | ^10.4.22 | ベンダープリフィックス |
| tsx | ^4.20.6 | TypeScript実行 |
| concurrently | ^9.2.1 | 並行実行 |
| date-fns | ^4.1.0 | 日付ユーティリティ |
| uuid | ^13.0.0 | UUID生成 |

### 8.3 主要ライブラリの用途

#### @dnd-kit

- `TaskList.tsx` でタスクのドラッグソートに使用
- `DndContext`, `SortableContext` でドラッグ領域を定義
- `useSortable` フックでドラッグ可能な要素を作成

#### canvas-confetti

- `TaskItem.tsx` でタスク完了時のアニメーションに使用
- 紙吹雪エフェクトでユーザー体験を向上

#### date-fns

- 日付のフォーマット、計算、比較に使用
- `formatDate`, `startOfWeek`, `addDays` などを利用

---

## 9. 拡張ポイント

### 9.1 新機能追加時の指針

#### タイマー拡張

- `useTimer.ts` に新しいモードやオプションを追加
- `TimerSettings.tsx` に設定UIを追加
- `Settings` 型を拡張

#### タスク機能拡張

- `Task` 型に新しいプロパティを追加
- `useTasks.ts` に対応するメソッドを追加
- `TaskItem.tsx` にUIを追加
- サーバー側の `PUT /api/tasks/:id` は自動的に新プロパティに対応

#### 新しいデータエンティティ追加

1. `src/types/index.ts` に型定義を追加
2. `data/` に新しいJSONファイルを作成
3. `server/index.ts` にCRUDエンドポイントを追加
4. `src/api/dataApi.ts` にAPI関数を追加
5. `src/hooks/` にカスタムフックを作成

### 9.2 変更影響範囲

| 変更対象 | 影響範囲 |
|---------|---------|
| Task型 | useTasks, TaskItem, TaskList, TaskForm, サーバー, API |
| Calendar型 | useCalendar, ContributionCalendar, CalendarCell, サーバー |
| Settings型 | App.tsx, TimerSettings, YouTubeSettings, サーバー |
| 新規コンポーネント | App.tsx（統合）、必要に応じてルーティング追加 |
| 新規API | server/index.ts, dataApi.ts, 対応するフック |

### 9.3 データマイグレーション

既存のJSONファイルに新しいフィールドを追加する場合：
1. 新フィールドはオプショナル（`?`）で定義
2. サーバー側で読み込み時にデフォルト値を設定
3. フロント側でも `??` でフォールバック値を設定

```typescript
// 例: Taskに新しいフィールドを追加
interface Task {
  // 既存フィールド...
  priority?: number;  // 新規追加（オプショナル）
}

// サーバー側
const tasks = data.tasks.map(t => ({
  ...t,
  priority: t.priority ?? 0  // デフォルト値
}));
```

---

## 付録

### A. ファイル構造

```
pomodoro/
└── app/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── index.html
    ├── SPEC.md              # 本仕様書
    │
    ├── data/                # データ永続化
    │   ├── tasks.json
    │   ├── calendar.json
    │   ├── categories.json
    │   ├── reflections.json
    │   ├── settings.json
    │   ├── taskHistory.json
    │   └── famous_saying.csv
    │
    ├── server/              # バックエンド
    │   └── index.ts
    │
    └── src/                 # フロントエンド
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        │
        ├── api/
        │   └── dataApi.ts
        │
        ├── components/
        │   ├── Timer/
        │   │   ├── Timer.tsx
        │   │   ├── TimerDisplay.tsx
        │   │   ├── TimerControls.tsx
        │   │   └── TimerSettings.tsx
        │   │
        │   ├── Tasks/
        │   │   ├── TaskList.tsx
        │   │   ├── TaskItem.tsx
        │   │   ├── SortableTaskItem.tsx
        │   │   ├── TaskForm.tsx
        │   │   └── FocusTask.tsx
        │   │
        │   ├── Category/
        │   │   ├── CategoryBadge.tsx
        │   │   ├── CategoryManager.tsx
        │   │   └── index.ts
        │   │
        │   ├── Calendar/
        │   │   ├── ContributionCalendar.tsx
        │   │   ├── YearlyCalendar.tsx
        │   │   └── CalendarCell.tsx
        │   │
        │   ├── YouTube/
        │   │   ├── YouTubeSection.tsx
        │   │   ├── YouTubePlayer.tsx
        │   │   └── YouTubeSettings.tsx
        │   │
        │   ├── Reflection/
        │   │   ├── ReflectionForm.tsx
        │   │   └── ReflectionDisplay.tsx
        │   │
        │   └── Quote/
        │       └── QuoteDisplay.tsx
        │
        ├── hooks/
        │   ├── useTasks.ts
        │   ├── useTimer.ts
        │   ├── useCalendar.ts
        │   └── useCategories.ts
        │
        ├── pages/
        │   └── DailyLogPage.tsx
        │
        ├── types/
        │   └── index.ts
        │
        └── utils/
            └── dateUtils.ts
```

### B. 開発コマンド

```bash
# フロント+バックエンド同時起動
npm start

# フロントエンドのみ
npm run dev

# バックエンドのみ
npm run server

# 本番ビルド
npm run build

# ビルドプレビュー
npm run preview
```

### C. 環境情報

| 項目 | 値 |
|------|-----|
| フロントエンドURL | http://localhost:5173 |
| バックエンドURL | http://localhost:3001 |
| APIプロキシ | /api → http://localhost:3001 |
