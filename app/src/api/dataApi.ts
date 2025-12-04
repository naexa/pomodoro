import { Task, TasksData, CalendarData, CalendarEntry, ReflectionsData, Reflection, Settings, TaskHistoryData, Quote, Category, CategoriesData, DailyStats, MonthlyStats } from '../types';
import { getAll, get, put, putAll, remove, STORES } from '../utils/indexedDB';
import { defaultQuotes } from '../data/defaultQuotes';

// IndexedDB用の内部型（dateフィールド付き）
interface CalendarEntryWithDate extends CalendarEntry {
  date: string;
}

interface TaskHistoryEntry {
  date: string;
  tasks: Task[];
}

// デフォルト設定
const DEFAULT_SETTINGS: Settings = {
  timer: {
    focusDuration: 1500,
    breakDuration: 300,
    longBreakDuration: 900,
    setsPerRound: 4,
  },
  youtube: {
    focusUrls: [],
    breakUrls: [],
  },
};

// Tasks API
export const fetchTasks = async (): Promise<TasksData> => {
  const tasks = await getAll<Task>(STORES.TASKS);
  // order順でソート
  tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { tasks };
};

export const createTask = async (task: Task): Promise<Task> => {
  await put(STORES.TASKS, task);
  return task;
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const existing = await get<Task>(STORES.TASKS, id);
  if (!existing) {
    throw new Error('Task not found');
  }
  const updated = { ...existing, ...updates };
  await put(STORES.TASKS, updated);
  return updated;
};

export const deleteTask = async (id: string): Promise<void> => {
  await remove(STORES.TASKS, id);
};

// Calendar API
export const fetchCalendar = async (): Promise<CalendarData> => {
  const entries = await getAll<CalendarEntryWithDate>(STORES.CALENDAR);
  const entriesMap: Record<string, CalendarEntry> = {};
  for (const entry of entries) {
    const { date, ...rest } = entry;
    entriesMap[date] = rest;
  }
  return { entries: entriesMap };
};

export const updateCalendarEntry = async (date: string, entry: CalendarEntry): Promise<CalendarEntry> => {
  const entryWithDate: CalendarEntryWithDate = { ...entry, date };
  await put(STORES.CALENDAR, entryWithDate);
  return entry;
};

// Reflections API
export const fetchReflections = async (): Promise<ReflectionsData> => {
  const reflections = await getAll<Reflection>(STORES.REFLECTIONS);
  // 日付順でソート（新しい順）
  reflections.sort((a, b) => b.date.localeCompare(a.date));
  return { reflections };
};

export const createReflection = async (reflection: Reflection): Promise<Reflection> => {
  await put(STORES.REFLECTIONS, reflection);
  return reflection;
};

export const updateReflection = async (id: string, updates: Partial<Reflection>): Promise<Reflection> => {
  const existing = await get<Reflection>(STORES.REFLECTIONS, id);
  if (!existing) {
    throw new Error('Reflection not found');
  }
  const updated = { ...existing, ...updates };
  await put(STORES.REFLECTIONS, updated);
  return updated;
};

// Settings API
export const fetchSettings = async (): Promise<Settings> => {
  const settings = await get<Settings>(STORES.SETTINGS, 'main');
  return settings ?? DEFAULT_SETTINGS;
};

export const updateSettings = async (settings: Settings): Promise<Settings> => {
  await put(STORES.SETTINGS, settings, 'main');
  return settings;
};

// Task History API
export const fetchTaskHistory = async (): Promise<TaskHistoryData> => {
  const entries = await getAll<TaskHistoryEntry>(STORES.TASK_HISTORY);
  const tasksMap: Record<string, Task[]> = {};
  for (const entry of entries) {
    tasksMap[entry.date] = entry.tasks;
  }
  return { tasks: tasksMap };
};

export const saveTaskToHistory = async (date: string, task: Task): Promise<{ tasks: Task[] }> => {
  const existing = await get<TaskHistoryEntry>(STORES.TASK_HISTORY, date);
  const tasks = existing?.tasks ?? [];

  // 同じIDのタスクがなければ追加
  const exists = tasks.some((t) => t.id === task.id);
  if (!exists) {
    tasks.push(task);
    await put(STORES.TASK_HISTORY, { date, tasks });
  }

  return { tasks };
};

// Daily Log API
export interface DailyLogResponse {
  date: string;
  calendarEntry: CalendarEntry;
  tasks: Task[];
  reflection: Reflection | null;
}

export const fetchDailyLog = async (date: string): Promise<DailyLogResponse> => {
  const [calendarData, taskHistoryData, reflectionsData, tasksData] = await Promise.all([
    fetchCalendar(),
    fetchTaskHistory(),
    fetchReflections(),
    fetchTasks(),
  ]);

  const calendarEntry = calendarData.entries[date] ?? { completedCount: 0, pomodoroCount: 0, tasks: [] };

  // まずtaskHistoryから取得、なければカレンダーのタスクIDからtasksを参照
  let tasks = taskHistoryData.tasks[date] ?? [];
  if (tasks.length === 0 && calendarEntry.tasks.length > 0) {
    tasks = tasksData.tasks.filter(
      (t) => calendarEntry.tasks.includes(t.id) && t.completed
    );
  }

  // 振り返りは「その日に書いた」もの（date フィールド）を検索
  const reflection = reflectionsData.reflections.find((r) => r.date === date) ?? null;

  return {
    date,
    calendarEntry,
    tasks,
    reflection,
  };
};

// Quotes API
export const fetchQuotes = async (): Promise<{ quotes: Quote[] }> => {
  let quotes = await getAll<Quote & { id: string }>(STORES.QUOTES);

  // 初回起動時: IndexedDBに名言がなければデフォルトを登録
  if (quotes.length === 0) {
    const quotesWithId = defaultQuotes.map((q, index) => ({
      ...q,
      id: String(index + 1),
    }));
    await putAll(STORES.QUOTES, quotesWithId);
    quotes = quotesWithId;
  }

  return { quotes };
};

// Categories API
export const fetchCategories = async (): Promise<CategoriesData> => {
  const categories = await getAll<Category>(STORES.CATEGORIES);
  // order順でソート
  categories.sort((a, b) => a.order - b.order);
  return { categories };
};

export const createCategory = async (category: Category): Promise<Category> => {
  await put(STORES.CATEGORIES, category);
  return category;
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  const existing = await get<Category>(STORES.CATEGORIES, id);
  if (!existing) {
    throw new Error('Category not found');
  }
  const updated = { ...existing, ...updates };
  await put(STORES.CATEGORIES, updated);
  return updated;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await remove(STORES.CATEGORIES, id);
};

// Stats API
export const fetchDailyStats = async (date: string): Promise<DailyStats> => {
  const [taskHistoryData, categoriesData] = await Promise.all([
    fetchTaskHistory(),
    fetchCategories(),
  ]);

  const tasks = taskHistoryData.tasks[date] ?? [];
  const categoryMap = new Map(categoriesData.categories.map((c) => [c.id, c]));

  const stats: Record<string, number> = {};
  let uncategorizedCount = 0;

  for (const task of tasks) {
    if (task.categoryId && categoryMap.has(task.categoryId)) {
      stats[task.categoryId] = (stats[task.categoryId] || 0) + 1;
    } else {
      uncategorizedCount++;
    }
  }

  const categoryStats = Object.entries(stats).map(([categoryId, count]) => {
    const cat = categoryMap.get(categoryId)!;
    return {
      categoryId,
      categoryName: cat.name,
      color: cat.color,
      completedCount: count,
    };
  });

  return {
    date,
    categories: categoryStats,
    uncategorizedCount,
  };
};

export const fetchMonthlyStats = async (month: string): Promise<MonthlyStats> => {
  const [taskHistoryData, categoriesData] = await Promise.all([
    fetchTaskHistory(),
    fetchCategories(),
  ]);

  const categoryMap = new Map(categoriesData.categories.map((c) => [c.id, c]));

  const monthlyStats: Record<string, number> = {};
  let monthlyUncategorized = 0;
  const dailyBreakdown: DailyStats[] = [];

  for (const [date, tasks] of Object.entries(taskHistoryData.tasks)) {
    if (!date.startsWith(month)) continue;

    const dayStats: Record<string, number> = {};
    let dayUncategorized = 0;

    for (const task of tasks) {
      if (task.categoryId && categoryMap.has(task.categoryId)) {
        dayStats[task.categoryId] = (dayStats[task.categoryId] || 0) + 1;
        monthlyStats[task.categoryId] = (monthlyStats[task.categoryId] || 0) + 1;
      } else {
        dayUncategorized++;
        monthlyUncategorized++;
      }
    }

    dailyBreakdown.push({
      date,
      categories: Object.entries(dayStats).map(([categoryId, count]) => {
        const cat = categoryMap.get(categoryId)!;
        return {
          categoryId,
          categoryName: cat.name,
          color: cat.color,
          completedCount: count,
        };
      }),
      uncategorizedCount: dayUncategorized,
    });
  }

  dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date));

  return {
    month,
    categories: Object.entries(monthlyStats).map(([categoryId, count]) => {
      const cat = categoryMap.get(categoryId)!;
      return {
        categoryId,
        categoryName: cat.name,
        color: cat.color,
        completedCount: count,
      };
    }),
    uncategorizedCount: monthlyUncategorized,
    dailyBreakdown,
  };
};

// Export API - 全データをダウンロード（IndexedDB版）
export const exportAllData = async (): Promise<void> => {
  const [tasks, calendar, categories, reflections, settings, taskHistory, quotes] = await Promise.all([
    fetchTasks(),
    fetchCalendar(),
    fetchCategories(),
    fetchReflections(),
    fetchSettings(),
    fetchTaskHistory(),
    fetchQuotes(),
  ]);

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      tasks: tasks.tasks,
      calendar: calendar.entries,
      categories: categories.categories,
      reflections: reflections.reflections,
      settings,
      taskHistory: taskHistory.tasks,
      quotes: quotes.quotes,
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pomodoro-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
