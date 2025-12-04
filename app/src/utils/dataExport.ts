/**
 * データエクスポート/インポート ユーティリティ
 */

import { Task, CalendarEntry, Category, Reflection, Settings, Quote } from '../types';
import { put, putAll, clear, STORES } from './indexedDB';

// エクスポートデータの型定義
export interface ExportData {
  version: number;
  exportedAt: string;
  data: {
    tasks: Task[];
    calendar: Record<string, CalendarEntry>;
    categories: Category[];
    reflections: Reflection[];
    settings: Settings;
    taskHistory: Record<string, Task[]>;
    quotes: Array<Quote & { id: string }>;
  };
}

/**
 * JSONファイルからデータをインポート
 * 既存データは上書きされる
 */
export const importAllData = async (file: File): Promise<void> => {
  const text = await file.text();
  const exportData: ExportData = JSON.parse(text);

  // バージョンチェック
  if (exportData.version !== 1) {
    throw new Error(`Unsupported export version: ${exportData.version}`);
  }

  const { data } = exportData;

  // 全ストアをクリアしてからインポート
  await Promise.all([
    clear(STORES.TASKS),
    clear(STORES.CALENDAR),
    clear(STORES.CATEGORIES),
    clear(STORES.REFLECTIONS),
    clear(STORES.SETTINGS),
    clear(STORES.TASK_HISTORY),
    clear(STORES.QUOTES),
  ]);

  // Tasks
  if (data.tasks && data.tasks.length > 0) {
    await putAll(STORES.TASKS, data.tasks);
  }

  // Calendar (dateフィールドを追加)
  if (data.calendar) {
    const calendarEntries = Object.entries(data.calendar).map(([date, entry]) => ({
      ...entry,
      date,
    }));
    if (calendarEntries.length > 0) {
      await putAll(STORES.CALENDAR, calendarEntries);
    }
  }

  // Categories
  if (data.categories && data.categories.length > 0) {
    await putAll(STORES.CATEGORIES, data.categories);
  }

  // Reflections
  if (data.reflections && data.reflections.length > 0) {
    await putAll(STORES.REFLECTIONS, data.reflections);
  }

  // Settings
  if (data.settings) {
    await put(STORES.SETTINGS, data.settings, 'main');
  }

  // TaskHistory (dateフィールドを追加)
  if (data.taskHistory) {
    const taskHistoryEntries = Object.entries(data.taskHistory).map(([date, tasks]) => ({
      date,
      tasks,
    }));
    if (taskHistoryEntries.length > 0) {
      await putAll(STORES.TASK_HISTORY, taskHistoryEntries);
    }
  }

  // Quotes
  if (data.quotes && data.quotes.length > 0) {
    await putAll(STORES.QUOTES, data.quotes);
  }
};

/**
 * ファイル選択ダイアログを開いてインポート
 */
export const selectAndImportFile = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        await importAllData(file);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    input.click();
  });
};
