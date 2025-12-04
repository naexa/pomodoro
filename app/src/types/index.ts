// カテゴリ
export interface Category {
  id: string;
  name: string;
  color: string;  // Tailwind色名 (例: "blue", "green", "red")
  order: number;
  createdAt: string;
}

export interface CategoriesData {
  categories: Category[];
}

// タスク
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  isFocused: boolean;
  createdAt: string;
  completedAt: string | null;
  order?: number;  // 並べ替え用
  categoryId?: string;  // カテゴリID
}

// カテゴリ別集計
export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  color: string;
  completedCount: number;
}

export interface DailyStats {
  date: string;
  categories: CategoryStats[];
  uncategorizedCount: number;
}

export interface MonthlyStats {
  month: string;  // "2025-12"
  categories: CategoryStats[];
  uncategorizedCount: number;
  dailyBreakdown: DailyStats[];
}

export interface TasksData {
  tasks: Task[];
}

// カレンダーエントリー
export interface CalendarEntry {
  completedCount: number;
  pomodoroCount: number;
  tasks: string[];
}

export interface CalendarData {
  entries: Record<string, CalendarEntry>;
}

// 振り返り
export interface Reflection {
  id: string;
  date: string;
  targetDate: string;
  content: string;
  createdAt: string;
}

export interface ReflectionsData {
  reflections: Reflection[];
}

// 設定
export interface YouTubeSettings {
  focusUrls: string[];  // 複数URL対応
  breakUrls: string[];  // 複数URL対応
}

export interface TimerSettings {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;  // 長め休憩（最終セット後）
  setsPerRound: number;       // 1ラウンドのセット数
}

// カレンダーの色しきい値設定
export interface CalendarThresholds {
  level1: number;  // この値以上でLevel 1
  level2: number;  // この値以上でLevel 2
  level3: number;  // この値以上でLevel 3
  level4: number;  // この値以上でLevel 4
}

export interface Settings {
  timer: TimerSettings;
  youtube: YouTubeSettings;
  calendarThresholds?: CalendarThresholds;  // オプショナル（後方互換性）
}

// タスク履歴（日付ごとに完了タスクを保存）
export interface TaskHistoryData {
  tasks: Record<string, Task[]>;  // 日付をキーに完了タスクの配列
}

// 名言
export interface Quote {
  author: string;
  message: string;
  imageUrl?: string;  // 将来の顔写真用
}

// タイマー状態
export type TimerMode = 'focus' | 'break';

export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  mode: TimerMode;
}
