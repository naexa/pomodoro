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
import { updateSettings, saveTaskToHistory } from './api/dataApi';
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

    fetch('/api/settings')
      .then((res) => res.json())
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
    <div className="min-h-screen bg-gray-100">
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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Pomodoro Timer
        </h1>

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

        {/* Timer Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                今日のポモドーロ:{' '}
                <span className="font-bold text-red-500">
                  {todayEntry?.pomodoroCount || 0}
                </span>{' '}
                回
              </div>
              <div className="text-sm text-gray-600">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">今日のタスク</h2>
              {categories.length > 0 && (
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="text-sm text-gray-500 hover:text-gray-700"
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

          {/* YouTube BGM */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">YouTube BGM</h2>
            <YouTubeSection
              mode={timerMode}
              isTimerRunning={isTimerRunning}
              focusUrls={settings.youtube.focusUrls}
              breakUrls={settings.youtube.breakUrls}
              onSettingsSave={handleYouTubeSettingsSave}
            />
          </div>
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
