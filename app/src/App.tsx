import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TimerDisplay, TimerControls, TimerSettings } from './components/Timer';
import { TaskList } from './components/Tasks';
import { YouTubeSection } from './components/YouTube';
import { ContributionCalendar } from './components/Calendar';
import { ReflectionForm, ReflectionDisplay } from './components/Reflection';
import { CategoryManager } from './components/Category';
import { useTasks } from './hooks/useTasks';
import { useCalendar } from './hooks/useCalendar';
import { useReflection } from './hooks/useReflection';
import { useCategories } from './hooks/useCategories';
import { usePomodoroContext } from './contexts/PomodoroContext';
import { YouTubeSettings, TimerSettings as TimerSettingsType, CalendarThresholds } from './types';
import { saveTaskToHistory, exportAllData } from './api/dataApi';
import { selectAndImportFile } from './utils/dataExport';
import { formatDate } from './utils/dateUtils';

const App: FC = () => {
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Context からタイマー状態と設定を取得
  const {
    timeLeft,
    isRunning,
    isPaused,
    mode,
    currentSet,
    totalSets,
    start,
    pause,
    resume,
    reset,
    resetAll,
    switchMode,
    settings,
    updateSettings,
    registerPomodoroCompleteCallback,
    registerRoundCompleteCallback,
  } = usePomodoroContext();

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
  }, []);

  useEffect(() => {
    if (!reflectionLoading && needsReflection()) {
      setShowReflectionForm(true);
    }
  }, [reflectionLoading, needsReflection]);

  // ポモドーロ完了時のコールバック登録
  useEffect(() => {
    registerPomodoroCompleteCallback(() => {
      incrementPomodoro();
    });
  }, [registerPomodoroCompleteCallback, incrementPomodoro]);

  // ラウンド完了時のコールバック登録
  useEffect(() => {
    registerRoundCompleteCallback(() => {
      // 全セット完了時の処理
    });
  }, [registerRoundCompleteCallback]);

  const handleTaskComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.completed) {
      await incrementCompleted(id);
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
    await updateSettings(newSettings);
  };

  const handleTimerSettingsSave = async (timerSettings: TimerSettingsType) => {
    const newSettings = {
      ...settings,
      timer: timerSettings,
    };
    await updateSettings(newSettings);
  };

  const handleCalendarThresholdsChange = async (thresholds: CalendarThresholds) => {
    const newSettings = {
      ...settings,
      calendarThresholds: thresholds,
    };
    await updateSettings(newSettings);
  };

  const handleReflectionSubmit = async (content: string) => {
    await addReflection(content);
    setShowReflectionForm(false);
  };

  const isLastSet = currentSet >= totalSets;

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
              {/* Timer Component inline - using context state */}
              <div
                className={`h-full flex flex-col justify-center p-8 rounded-3xl shadow-soft backdrop-blur-xl transition-colors duration-500 ${
                  mode === 'focus' ? 'bg-white/80 border border-white/50' : 'bg-green-50/80 border border-green-100/50'
                }`}
              >
                {/* セット表示 */}
                <div className="text-center mb-2">
                  <span className="text-sm text-gray-500">
                    セット {currentSet} / {totalSets}
                    {mode === 'break' && isLastSet && (
                      <span className="ml-2 text-green-600 font-medium">（長め休憩）</span>
                    )}
                  </span>
                </div>

                <TimerDisplay timeLeft={timeLeft} mode={mode} />

                <TimerControls
                  isRunning={isRunning}
                  isPaused={isPaused}
                  onStart={start}
                  onPause={pause}
                  onResume={resume}
                  onReset={reset}
                  onResetAll={resetAll}
                  onSwitchMode={() => switchMode()}
                />
              </div>
            </div>
          </div>

          {/* YouTube BGM */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3 px-2 h-8">
              <h2 className="text-lg font-semibold text-text-muted">YouTube BGM</h2>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 flex-1 flex flex-col justify-center">
              <YouTubeSection
                mode={mode}
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
