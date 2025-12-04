import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePomodoroContext } from '../../contexts/PomodoroContext';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ミニプレイヤーのタイマー部分のみ
// YouTube部分はAppLayoutで直接管理される
export const FloatingMiniPlayer: FC = () => {
  const navigate = useNavigate();
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
  } = usePomodoroContext();

  const handlePlayPause = () => {
    if (isRunning) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      start();
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const modeColor = mode === 'focus' ? 'bg-primary' : 'bg-green-500';

  return (
    <div className="p-3 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* モードインジケーター */}
          <div className={`w-2 h-2 rounded-full ${modeColor} ${isRunning ? 'animate-pulse' : ''}`} />

          {/* タイマー表示 */}
          <span className="text-2xl font-bold text-text-main tabular-nums">
            {formatTime(timeLeft)}
          </span>

          {/* セット情報 */}
          <span className="text-xs text-text-muted">
            {currentSet}/{totalSets}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* 再生/一時停止ボタン */}
          <button
            onClick={handlePlayPause}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isRunning
                ? 'bg-gray-100 hover:bg-gray-200 text-text-main'
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
            title={isRunning ? '一時停止' : isPaused ? '再開' : '開始'}
          >
            {isRunning ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* 戻るボタン */}
          <button
            onClick={handleGoBack}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
            title="トップに戻る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>
        </div>
      </div>

      {/* モード表示 */}
      <div className="mt-1">
        <span className={`text-xs font-medium ${mode === 'focus' ? 'text-primary' : 'text-green-500'}`}>
          {mode === 'focus' ? '集中タイム' : '休憩タイム'}
        </span>
      </div>
    </div>
  );
};
