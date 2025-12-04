import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerMode } from '../types';

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

// sessionStorageからタイマー状態を復元
const loadTimerState = (focusDuration: number, _setsPerRound: number): TimerState | null => {
  try {
    const saved = sessionStorage.getItem(TIMER_STATE_KEY);
    const timestamp = sessionStorage.getItem(TIMER_TIMESTAMP_KEY);
    if (saved && timestamp) {
      const state = JSON.parse(saved) as TimerState;
      const savedTime = parseInt(timestamp, 10);
      const elapsed = Math.floor((Date.now() - savedTime) / 1000);

      // タイマーが動いていた場合、経過時間を引く
      if (state.isRunning && !state.isPaused) {
        state.timeLeft = Math.max(0, state.timeLeft - elapsed);
        // 時間切れの場合は一時停止状態で復元
        if (state.timeLeft <= 0) {
          state.timeLeft = state.mode === 'focus' ? focusDuration : 300;
          state.isRunning = false;
          state.isPaused = true;
        } else {
          // リロード後は一時停止状態で復元
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

// sessionStorageにタイマー状態を保存
const saveTimerState = (state: TimerState) => {
  try {
    sessionStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
    sessionStorage.setItem(TIMER_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.error('Failed to save timer state:', e);
  }
};

interface UseTimerProps {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  setsPerRound: number;
  onModeChange?: (mode: TimerMode) => void;
  onComplete?: (mode: TimerMode, currentSet: number, totalSets: number) => void;
  onRoundComplete?: () => void;
}

export const useTimer = ({
  focusDuration,
  breakDuration,
  longBreakDuration,
  setsPerRound,
  onModeChange,
  onComplete,
  onRoundComplete,
}: UseTimerProps) => {
  const [state, setState] = useState<TimerState>(() => {
    const saved = loadTimerState(focusDuration, setsPerRound);
    if (saved) {
      return { ...saved, totalSets: setsPerRound };
    }
    return {
      timeLeft: focusDuration,
      isRunning: false,
      isPaused: false,
      mode: 'focus',
      currentSet: 1,
      totalSets: setsPerRound,
    };
  });

  const intervalRef = useRef<number | null>(null);

  // 状態が変わるたびに保存
  useEffect(() => {
    saveTimerState(state);
  }, [state]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setState((prev) => ({
      ...prev,
      timeLeft: prev.mode === 'focus' ? focusDuration : breakDuration,
      isRunning: false,
      isPaused: false,
    }));
  }, [focusDuration, breakDuration, clearTimer]);

  const resetAll = useCallback(() => {
    clearTimer();
    setState({
      timeLeft: focusDuration,
      isRunning: false,
      isPaused: false,
      mode: 'focus',
      currentSet: 1,
      totalSets: setsPerRound,
    });
    onModeChange?.('focus');
  }, [focusDuration, setsPerRound, onModeChange, clearTimer]);

  const switchMode = useCallback((newMode?: TimerMode) => {
    clearTimer();
    const mode = newMode || (state.mode === 'focus' ? 'break' : 'focus');
    const isLongBreak = mode === 'break' && state.currentSet >= state.totalSets;
    setState((prev) => ({
      ...prev,
      mode,
      timeLeft: mode === 'focus'
        ? focusDuration
        : (isLongBreak ? longBreakDuration : breakDuration),
      isRunning: false,
      isPaused: false,
    }));
    onModeChange?.(mode);
  }, [state.mode, state.currentSet, state.totalSets, focusDuration, breakDuration, longBreakDuration, onModeChange, clearTimer]);

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = window.setInterval(() => {
        setState((prev) => {
          if (prev.timeLeft <= 1) {
            onComplete?.(prev.mode, prev.currentSet, prev.totalSets);

            if (prev.mode === 'focus') {
              // 集中終了 → 休憩へ
              const isLastSet = prev.currentSet >= prev.totalSets;
              const newBreakDuration = isLastSet ? longBreakDuration : breakDuration;
              onModeChange?.('break');
              return {
                ...prev,
                mode: 'break',
                timeLeft: newBreakDuration,
                isRunning: true,
              };
            } else {
              // 休憩終了
              const isLastSet = prev.currentSet >= prev.totalSets;
              if (isLastSet) {
                // 全セット完了
                onRoundComplete?.();
                onModeChange?.('focus');
                return {
                  ...prev,
                  mode: 'focus',
                  timeLeft: focusDuration,
                  currentSet: 1,
                  isRunning: false,
                  isPaused: false,
                };
              } else {
                // 次のセットへ
                onModeChange?.('focus');
                return {
                  ...prev,
                  mode: 'focus',
                  timeLeft: focusDuration,
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
  }, [state.isRunning, state.isPaused, focusDuration, breakDuration, longBreakDuration, onModeChange, onComplete, onRoundComplete, clearTimer]);

  // Update when settings change
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      totalSets: setsPerRound,
    }));
  }, [setsPerRound]);

  useEffect(() => {
    if (!state.isRunning && !state.isPaused) {
      setState((prev) => ({
        ...prev,
        timeLeft: prev.mode === 'focus' ? focusDuration : breakDuration,
      }));
    }
  }, [focusDuration, breakDuration, state.isRunning, state.isPaused]);

  return {
    ...state,
    start,
    pause,
    resume,
    reset,
    resetAll,
    switchMode,
  };
};
