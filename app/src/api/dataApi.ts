import { Task, TasksData, CalendarData, CalendarEntry, ReflectionsData, Reflection, Settings, TaskHistoryData, Quote, Category, CategoriesData, DailyStats, MonthlyStats } from '../types';

const API_BASE = '/api';

// Tasks API
export const fetchTasks = async (): Promise<TasksData> => {
  const res = await fetch(`${API_BASE}/tasks`);
  return res.json();
};

export const createTask = async (task: Task): Promise<Task> => {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return res.json();
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
};

export const deleteTask = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
};

// Calendar API
export const fetchCalendar = async (): Promise<CalendarData> => {
  const res = await fetch(`${API_BASE}/calendar`);
  return res.json();
};

export const updateCalendarEntry = async (date: string, entry: CalendarEntry): Promise<CalendarEntry> => {
  const res = await fetch(`${API_BASE}/calendar/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  return res.json();
};

// Reflections API
export const fetchReflections = async (): Promise<ReflectionsData> => {
  const res = await fetch(`${API_BASE}/reflections`);
  return res.json();
};

export const createReflection = async (reflection: Reflection): Promise<Reflection> => {
  const res = await fetch(`${API_BASE}/reflections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reflection),
  });
  return res.json();
};

export const updateReflection = async (id: string, updates: Partial<Reflection>): Promise<Reflection> => {
  const res = await fetch(`${API_BASE}/reflections/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
};

// Settings API
export const fetchSettings = async (): Promise<Settings> => {
  const res = await fetch(`${API_BASE}/settings`);
  return res.json();
};

export const updateSettings = async (settings: Settings): Promise<Settings> => {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.json();
};

// Task History API
export const fetchTaskHistory = async (): Promise<TaskHistoryData> => {
  const res = await fetch(`${API_BASE}/task-history`);
  return res.json();
};

export const saveTaskToHistory = async (date: string, task: Task): Promise<{ tasks: Task[] }> => {
  const res = await fetch(`${API_BASE}/task-history/${date}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return res.json();
};

// Daily Log API
export interface DailyLogResponse {
  date: string;
  calendarEntry: CalendarEntry;
  tasks: Task[];
  reflection: Reflection | null;
}

export const fetchDailyLog = async (date: string): Promise<DailyLogResponse> => {
  const res = await fetch(`${API_BASE}/daily-log/${date}`);
  return res.json();
};

// Quotes API
export const fetchQuotes = async (): Promise<{ quotes: Quote[] }> => {
  const res = await fetch(`${API_BASE}/quotes`);
  return res.json();
};

// Categories API
export const fetchCategories = async (): Promise<CategoriesData> => {
  const res = await fetch(`${API_BASE}/categories`);
  return res.json();
};

export const createCategory = async (category: Category): Promise<Category> => {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  });
  return res.json();
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
};

export const deleteCategory = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
};

// Stats API
export const fetchDailyStats = async (date: string): Promise<DailyStats> => {
  const res = await fetch(`${API_BASE}/stats/daily/${date}`);
  return res.json();
};

export const fetchMonthlyStats = async (month: string): Promise<MonthlyStats> => {
  const res = await fetch(`${API_BASE}/stats/monthly/${month}`);
  return res.json();
};

// Export API - 全データをダウンロード
export const exportAllData = async (): Promise<void> => {
  const res = await fetch(`${API_BASE}/export`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pomodoro-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
