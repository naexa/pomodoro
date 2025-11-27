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

interface UseTimerProps {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  setsPerRound: number;
  onModeChange?: (mode: TimerMode) => void;
  onComplete?: (mode: TimerMode) => void;
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
  const [state, setState] = useState<TimerState>({
    timeLeft: focusDuration,
    isRunning: false,
    isPaused: false,
    mode: 'focus',
    currentSet: 1,
    totalSets: setsPerRound,
  });

  const intervalRef = useRef<number | null>(null);

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
            onComplete?.(prev.mode);

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
