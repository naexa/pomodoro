import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Settings, TimerMode } from '../types';
import { fetchSettings, updateSettings as saveSettings } from '../api/dataApi';

// タイマー状態
interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  mode: TimerMode;
  currentSet: number;
  totalSets: number;
}

const TIMER_STATE_KEY = 'pomodoro_timer_state';
const TIMER_TIMESTAMP_KEY = 'pomodoro_timer_timestamp';

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

// sessionStorageからタイマー状態を復元
const loadTimerState = (focusDuration: number): TimerState | null => {
  try {
    const saved = sessionStorage.getItem(TIMER_STATE_KEY);
    const timestamp = sessionStorage.getItem(TIMER_TIMESTAMP_KEY);
    if (saved && timestamp) {
      const state = JSON.parse(saved) as TimerState;
      const savedTime = parseInt(timestamp, 10);
      const elapsed = Math.floor((Date.now() - savedTime) / 1000);

      if (state.isRunning && !state.isPaused) {
        state.timeLeft = Math.max(0, state.timeLeft - elapsed);
        if (state.timeLeft <= 0) {
          state.timeLeft = state.mode === 'focus' ? focusDuration : 300;
          state.isRunning = false;
          state.isPaused = true;
        } else {
          state.isRunning = false;
          state.isPaused = true;
        }
      }
      return state;
    }
  } catch (e) {
    console.error('Failed to load timer state:', e);
  }
  return null;
};

const saveTimerState = (state: TimerState) => {
  try {
    sessionStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
    sessionStorage.setItem(TIMER_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.error('Failed to save timer state:', e);
  }
};

// Context型定義
interface PomodoroContextValue {
  // Timer state
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  mode: TimerMode;
  currentSet: number;
  totalSets: number;

  // Timer controls
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  resetAll: () => void;
  switchMode: (mode?: TimerMode) => void;

  // YouTube state
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;

  // Settings
  settings: Settings;
  updateSettings: (s: Settings) => Promise<void>;

  // Callbacks registration
  registerPomodoroCompleteCallback: (cb: () => void) => void;
  registerRoundCompleteCallback: (cb: () => void) => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export const usePomodoroContext = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoroContext must be used within PomodoroProvider');
  }
  return context;
};

interface PomodoroProviderProps {
  children: ReactNode;
}

export const PomodoroProvider: FC<PomodoroProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // タイマー状態
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const saved = loadTimerState(DEFAULT_SETTINGS.timer.focusDuration);
    if (saved) {
      return { ...saved, totalSets: DEFAULT_SETTINGS.timer.setsPerRound };
    }
    return {
      timeLeft: DEFAULT_SETTINGS.timer.focusDuration,
      isRunning: false,
      isPaused: false,
      mode: 'focus',
      currentSet: 1,
      totalSets: DEFAULT_SETTINGS.timer.setsPerRound,
    };
  });

  const intervalRef = useRef<number | null>(null);
  const pomodoroCompleteCallbackRef = useRef<(() => void) | null>(null);
  const roundCompleteCallbackRef = useRef<(() => void) | null>(null);

  // 設定読み込み
  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setSettings(data);
        // 設定読み込み後、totalSetsを更新
        setTimerState((prev) => ({
          ...prev,
          totalSets: data.timer.setsPerRound,
        }));
      })
      .catch(() => console.log('Using default settings'));
  }, []);

  // タイマー状態保存
  useEffect(() => {
    saveTimerState(timerState);
  }, [timerState]);

  // インターバルクリア
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // タイマー制御
  const start = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  }, []);

  const pause = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isRunning: false, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setTimerState((prev) => ({
      ...prev,
      timeLeft:
        prev.mode === 'focus'
          ? settings.timer.focusDuration
          : settings.timer.breakDuration,
      isRunning: false,
      isPaused: false,
    }));
  }, [settings.timer.focusDuration, settings.timer.breakDuration, clearTimer]);

  const resetAll = useCallback(() => {
    clearTimer();
    setTimerState({
      timeLeft: settings.timer.focusDuration,
      isRunning: false,
      isPaused: false,
      mode: 'focus',
      currentSet: 1,
      totalSets: settings.timer.setsPerRound,
    });
  }, [settings.timer.focusDuration, settings.timer.setsPerRound, clearTimer]);

  const switchMode = useCallback(
    (newMode?: TimerMode) => {
      clearTimer();
      const mode = newMode || (timerState.mode === 'focus' ? 'break' : 'focus');
      const isLongBreak =
        mode === 'break' && timerState.currentSet >= timerState.totalSets;
      setTimerState((prev) => ({
        ...prev,
        mode,
        timeLeft:
          mode === 'focus'
            ? settings.timer.focusDuration
            : isLongBreak
              ? settings.timer.longBreakDuration
              : settings.timer.breakDuration,
        isRunning: false,
        isPaused: false,
      }));
    },
    [
      timerState.mode,
      timerState.currentSet,
      timerState.totalSets,
      settings.timer,
      clearTimer,
    ]
  );

  // タイマーのカウントダウン処理
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = window.setInterval(() => {
        setTimerState((prev) => {
          if (prev.timeLeft <= 1) {
            // 完了通知
            if (prev.mode === 'focus') {
              pomodoroCompleteCallbackRef.current?.();

              // 通知
              if (Notification.permission === 'granted') {
                if (prev.currentSet >= prev.totalSets) {
                  new Notification('お疲れ様でした！', {
                    body: '全セット完了しました。素晴らしい集中力でした！ゆっくり休憩しましょう。',
                  });
                } else {
                  new Notification('集中タイム終了！休憩しましょう');
                }
              }

              // 休憩へ
              const isLastSet = prev.currentSet >= prev.totalSets;
              const newBreakDuration = isLastSet
                ? settings.timer.longBreakDuration
                : settings.timer.breakDuration;
              return {
                ...prev,
                mode: 'break',
                timeLeft: newBreakDuration,
                isRunning: true,
              };
            } else {
              // 休憩終了
              if (Notification.permission === 'granted') {
                new Notification('休憩終了！集中タイムです');
              }

              const isLastSet = prev.currentSet >= prev.totalSets;
              if (isLastSet) {
                // 全セット完了
                roundCompleteCallbackRef.current?.();
                return {
                  ...prev,
                  mode: 'focus',
                  timeLeft: settings.timer.focusDuration,
                  currentSet: 1,
                  isRunning: false,
                  isPaused: false,
                };
              } else {
                // 次のセットへ
                return {
                  ...prev,
                  mode: 'focus',
                  timeLeft: settings.timer.focusDuration,
                  currentSet: prev.currentSet + 1,
                  isRunning: true,
                };
              }
            }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [
    timerState.isRunning,
    timerState.isPaused,
    settings.timer,
    clearTimer,
  ]);

  // 設定変更時
  useEffect(() => {
    setTimerState((prev) => ({
      ...prev,
      totalSets: settings.timer.setsPerRound,
    }));
  }, [settings.timer.setsPerRound]);

  useEffect(() => {
    if (!timerState.isRunning && !timerState.isPaused) {
      setTimerState((prev) => ({
        ...prev,
        timeLeft:
          prev.mode === 'focus'
            ? settings.timer.focusDuration
            : settings.timer.breakDuration,
      }));
    }
  }, [
    settings.timer.focusDuration,
    settings.timer.breakDuration,
    timerState.isRunning,
    timerState.isPaused,
  ]);

  const handleUpdateSettings = useCallback(async (newSettings: Settings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, []);

  const registerPomodoroCompleteCallback = useCallback((cb: () => void) => {
    pomodoroCompleteCallbackRef.current = cb;
  }, []);

  const registerRoundCompleteCallback = useCallback((cb: () => void) => {
    roundCompleteCallbackRef.current = cb;
  }, []);

  const value: PomodoroContextValue = {
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning,
    isPaused: timerState.isPaused,
    mode: timerState.mode,
    currentSet: timerState.currentSet,
    totalSets: timerState.totalSets,
    start,
    pause,
    resume,
    reset,
    resetAll,
    switchMode,
    youtubeUrl,
    setYoutubeUrl,
    settings,
    updateSettings: handleUpdateSettings,
    registerPomodoroCompleteCallback,
    registerRoundCompleteCallback,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};
