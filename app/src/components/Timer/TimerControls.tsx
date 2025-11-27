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
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* メインボタン */}
      <div className="flex justify-center gap-4">
        {!isRunning && !isPaused ? (
          <button
            onClick={onStart}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            開始
          </button>
        ) : isRunning ? (
          <button
            onClick={onPause}
            className="px-8 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
          >
            一時停止
          </button>
        ) : (
          <button
            onClick={onResume}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            再開
          </button>
        )}
        <button
          onClick={onReset}
          className="px-8 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          リセット
        </button>
        <button
          onClick={onSwitchMode}
          className="px-8 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
        >
          モード切替
        </button>
      </div>

      {/* 全リセットボタン */}
      <button
        onClick={onResetAll}
        className="text-sm text-gray-500 hover:text-gray-700 underline"
      >
        セットを最初からやり直す
      </button>
    </div>
  );
};
