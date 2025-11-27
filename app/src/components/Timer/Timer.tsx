import { FC, useEffect } from 'react';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { useTimer } from '../../hooks/useTimer';
import { TimerMode } from '../../types';

interface TimerProps {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  setsPerRound: number;
  onModeChange?: (mode: TimerMode) => void;
  onPomodoroComplete?: () => void;
  onRunningChange?: (isRunning: boolean) => void;
  onRoundComplete?: () => void;
}

export const Timer: FC<TimerProps> = ({
  focusDuration,
  breakDuration,
  longBreakDuration,
  setsPerRound,
  onModeChange,
  onPomodoroComplete,
  onRunningChange,
  onRoundComplete,
}) => {
  const handleComplete = (mode: TimerMode) => {
    if (mode === 'focus') {
      onPomodoroComplete?.();
    }
    // Play notification sound
    if (Notification.permission === 'granted') {
      new Notification(
        mode === 'focus' ? '集中タイム終了！休憩しましょう' : '休憩終了！集中タイムです'
      );
    }
  };

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
  } = useTimer({
    focusDuration,
    breakDuration,
    longBreakDuration,
    setsPerRound,
    onModeChange,
    onComplete: handleComplete,
    onRoundComplete,
  });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const isLastSet = currentSet >= totalSets;

  return (
    <div
      className={`p-8 rounded-2xl ${
        mode === 'focus' ? 'bg-red-50' : 'bg-green-50'
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
  );
};
