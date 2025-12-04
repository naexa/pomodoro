import { FC } from 'react';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onResetAll: () => void;
  onSwitchMode: () => void;
}

export const TimerControls: FC<TimerControlsProps> = ({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onReset,
  onResetAll,
  onSwitchMode,
}) => {
  return (
    <div className="flex flex-col items-center gap-6 mt-10">
      {/* Main Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={onReset}
          className="p-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          title="リセット"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        {!isRunning && !isPaused ? (
          <button
            onClick={onStart}
            className="w-20 h-20 flex items-center justify-center bg-primary text-white rounded-full shadow-glow hover:bg-primary-hover hover:scale-105 transition-all duration-200"
            title="開始"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        ) : isRunning ? (
          <button
            onClick={onPause}
            className="w-20 h-20 flex items-center justify-center bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 hover:scale-105 transition-all duration-200"
            title="一時停止"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onResume}
            className="w-20 h-20 flex items-center justify-center bg-primary text-white rounded-full shadow-glow hover:bg-primary-hover hover:scale-105 transition-all duration-200"
            title="再開"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        )}

        <button
          onClick={onSwitchMode}
          className="p-4 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-full transition-all duration-200"
          title="スキップ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      </div>

      {/* Reset All */}
      <button
        onClick={onResetAll}
        className="text-xs text-text-muted hover:text-text-main transition-colors mt-2"
      >
        セットを最初からやり直す
      </button>
    </div>
  );
};
