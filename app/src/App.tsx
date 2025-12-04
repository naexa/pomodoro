import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Timer, TimerSettings } from './components/Timer';
import { TaskList } from './components/Tasks';
import { YouTubeSection } from './components/YouTube';
import { ContributionCalendar } from './components/Calendar';
import { ReflectionForm, ReflectionDisplay } from './components/Reflection';
import { CategoryManager } from './components/Category';
import { useTasks } from './hooks/useTasks';
import { useCalendar } from './hooks/useCalendar';
import { useReflection } from './hooks/useReflection';
import { useCategories } from './hooks/useCategories';
import { Settings, TimerMode, YouTubeSettings, TimerSettings as TimerSettingsType, CalendarThresholds } from './types';
import { updateSettings, saveTaskToHistory, exportAllData, fetchSettings } from './api/dataApi';
import { selectAndImportFile } from './utils/dataExport';
import { formatDate } from './utils/dateUtils';

const DEFAULT_SETTINGS: Settings = {
  timer: {
    focusDuration: 1500,
    breakDuration: 300,
    longBreakDuration: 900,  // 15分
    setsPerRound: 4,         // 4セット
  },
  youtube: {
    focusUrls: [],
    breakUrls: [],
  },
};

const App: FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const {
    tasks,
    focusedTask,
    addTask,
    editTask,
    toggleComplete,
    removeTask,
    setFocusTask,
    reorderTasks,
  } = useTasks();

  const { data: calendarData, incrementCompleted, incrementPomodoro, getEntry } = useCalendar();
  const todayEntry = getEntry(formatDate(new Date()));
  const { loading: reflectionLoading, addReflection, editReflection, getTodayReflection, needsReflection } = useReflection();
  const { categories, addCategory, editCategory, removeCategory } = useCategories();

  const todayReflection = getTodayReflection();

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchSettings()
      .then((data) => setSettings(data))
      .catch(() => console.log('Using default settings'));
  }, []);

  useEffect(() => {
    // Wait for reflections to load before checking if we need the form
    if (!reflectionLoading && needsReflection()) {
      setShowReflectionForm(true);
    }
  }, [reflectionLoading, needsReflection]);

  const handleModeChange = (mode: TimerMode) => {
    setTimerMode(mode);
  };

  const handlePomodoroComplete = () => {
    incrementPomodoro();
  };

  const handleRoundComplete = () => {
    // YouTubeを停止（isTimerRunning=falseにする）
    setIsTimerRunning(false);
  };

  const handleTaskComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.completed) {
      await incrementCompleted(id);
      // タスク履歴に保存（エラーでも続行）
      try {
        const today = formatDate(new Date());
        const completedTask = {
          ...task,
          completed: true,
          completedAt: new Date().toISOString(),
        };
        await saveTaskToHistory(today, completedTask);
      } catch (error) {
        console.error('Failed to save task history:', error);
      }
    }
    await toggleComplete(id);
  };

  const handleYouTubeSettingsSave = async (youtubeSettings: YouTubeSettings) => {
    const newSettings = { ...settings, youtube: youtubeSettings };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  const handleTimerSettingsSave = async (timerSettings: TimerSettingsType) => {
    const newSettings = {
      ...settings,
      timer: timerSettings,
    };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  const handleCalendarThresholdsChange = async (thresholds: CalendarThresholds) => {
    const newSettings = {
      ...settings,
      calendarThresholds: thresholds,
    };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  const handleReflectionSubmit = async (content: string) => {
    await addReflection(content);
    setShowReflectionForm(false);
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main selection:bg-primary/20">
      {showReflectionForm && (
        <ReflectionForm
          onSubmit={handleReflectionSubmit}
          onSkip={() => setShowReflectionForm(false)}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onEdit={editCategory}
          onDelete={removeCategory}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-light tracking-tight text-text-main">
            Pomodoro<span className="font-bold text-primary">Timer</span>
          </h1>
          <div className="flex gap-2">
            <button
              onClick={exportAllData}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors"
            >
              エクスポート
            </button>
            <button
              onClick={async () => {
                if (confirm('現在のデータを上書きしてインポートしますか？')) {
                  try {
                    await selectAndImportFile();
                    alert('インポートが完了しました。ページを再読み込みします。');
                    window.location.reload();
                  } catch (error) {
                    alert('インポートに失敗しました: ' + (error as Error).message);
                  }
                }
              }}
              className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/30 transition-all"
            >
              インポート
            </button>
          </div>
        </div>

        {/* Today's Reflection Display */}
        {todayReflection && (
          <div className="mb-6">
            <ReflectionDisplay reflection={todayReflection} onEdit={editReflection} />
          </div>
        )}

        {/* Focus Task Display */}
        {focusedTask && (
          <div className="mb-4 p-3 bg-blue-100 rounded-lg text-center">
            <span className="text-blue-600 font-semibold">集中中: </span>
            <span className="text-blue-800 font-bold">{focusedTask.title}</span>
          </div>
        )}

        {/* Top Section: Timer & YouTube */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
          {/* Timer Section */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3 px-2 h-8">
              <div className="flex items-center gap-4">
                <div className="text-sm text-text-muted">
                  今日のポモドーロ:{' '}
                  <span className="font-bold text-secondary">
                    {todayEntry?.pomodoroCount || 0}
                  </span>{' '}
                  回
                </div>
                <div className="text-sm text-text-muted">
                  完了タスク:{' '}
                  <span className="font-bold text-green-500">
                    {todayEntry?.completedCount || 0}
                  </span>{' '}
                  件
                </div>
              </div>
              <TimerSettings
                settings={settings.timer}
                onSave={handleTimerSettingsSave}
              />
            </div>
            <div className="flex-1">
              <Timer
                focusDuration={settings.timer.focusDuration}
                breakDuration={settings.timer.breakDuration}
                longBreakDuration={settings.timer.longBreakDuration}
                setsPerRound={settings.timer.setsPerRound}
                onModeChange={handleModeChange}
                onPomodoroComplete={handlePomodoroComplete}
                onRunningChange={setIsTimerRunning}
                onRoundComplete={handleRoundComplete}
              />
            </div>
          </div>

          {/* YouTube BGM */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3 px-2 h-8">
              <h2 className="text-lg font-semibold text-text-muted">YouTube BGM</h2>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 flex-1 flex flex-col justify-center">
              <YouTubeSection
                mode={timerMode}
                isTimerRunning={isTimerRunning}
                focusUrls={settings.youtube.focusUrls}
                breakUrls={settings.youtube.breakUrls}
                onSettingsSave={handleYouTubeSettingsSave}
              />
            </div>
          </div>
        </div>

        {/* Task Management (Full Width) */}
        <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-main">今日のタスク</h2>
            {categories.length > 0 && (
              <button
                onClick={() => setShowCategoryManager(true)}
                className="text-sm text-text-muted hover:text-primary transition-colors"
              >
                カテゴリ管理
              </button>
            )}
          </div>
          <TaskList
            tasks={tasks}
            focusedTask={focusedTask}
            categories={categories}
            onAdd={addTask}
            onEdit={editTask}
            onToggleComplete={handleTaskComplete}
            onDelete={removeTask}
            onSetFocus={setFocusTask}
            onReorder={reorderTasks}
            onCreateCategory={addCategory}
          />
        </div>

        {/* Contribution Calendar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-800">Contribution Calendar</h2>
            <Link
              to="/log"
              target="_blank"
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              日別ログを見る →
            </Link>
          </div>
          <ContributionCalendar
            data={calendarData}
            thresholds={settings.calendarThresholds}
            onThresholdsChange={handleCalendarThresholdsChange}
          />
          <p className="text-xs text-gray-400 mt-2">
            ※ カレンダーの日付をクリックすると詳細ログが開きます
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
