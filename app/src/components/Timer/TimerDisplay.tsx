import { FC } from 'react';
import { TimerMode } from '../../types';
import { formatTime } from '../../utils/timeUtils';

interface TimerDisplayProps {
  timeLeft: number;
  mode: TimerMode;
}

export const TimerDisplay: FC<TimerDisplayProps> = ({ timeLeft, mode }) => {
  return (
    <div className="text-center">
      <div
        className={`text-8xl font-mono font-bold ${
          mode === 'focus' ? 'text-red-500' : 'text-green-500'
        }`}
      >
        {formatTime(timeLeft)}
      </div>
      <div
        className={`text-2xl mt-4 font-semibold ${
          mode === 'focus' ? 'text-red-400' : 'text-green-400'
        }`}
      >
        {mode === 'focus' ? '集中タイム' : '休憩タイム'}
      </div>
    </div>
  );
};
