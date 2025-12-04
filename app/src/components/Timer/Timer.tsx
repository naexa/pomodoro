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
  const handleComplete = (mode: TimerMode, currentSet: number, totalSets: number) => {
    if (mode === 'focus') {
      onPomodoroComplete?.();
    }
    // Play notification
    if (Notification.permission === 'granted') {
      if (mode === 'focus' && currentSet >= totalSets) {
        // 最後の集中タイム終了
        new Notification('🎉 お疲れ様でした！', {
          body: '全セット完了しました。素晴らしい集中力でした！ゆっくり休憩しましょう。',
        });
      } else if (mode === 'focus') {
        new Notification('集中タイム終了！休憩しましょう');
      } else {
        new Notification('休憩終了！集中タイムです');
      }
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
      className={`h-full flex flex-col justify-center p-8 rounded-3xl shadow-soft backdrop-blur-xl transition-colors duration-500 ${mode === 'focus' ? 'bg-white/80 border border-white/50' : 'bg-green-50/80 border border-green-100/50'
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
