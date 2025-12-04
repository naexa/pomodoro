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
        className={`text-9xl font-light tracking-tight tabular-nums transition-colors duration-500 ${mode === 'focus' ? 'text-primary' : 'text-green-500'
          }`}
      >
        {formatTime(timeLeft)}
      </div>
      <div
        className={`text-xl mt-2 font-medium tracking-widest uppercase transition-colors duration-500 ${mode === 'focus' ? 'text-primary/60' : 'text-green-500/60'
          }`}
      >
        {mode === 'focus' ? 'Focus' : 'Break'}
      </div>
    </div>
  );
};
