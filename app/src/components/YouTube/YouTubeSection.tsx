import { FC, useState, useEffect, useRef } from 'react';
import { TimerMode, YouTubeSettings as YouTubeSettingsType } from '../../types';
import { YouTubePlayer } from './YouTubePlayer';
import { YouTubeSettings } from './YouTubeSettings';
import { QuoteDisplay } from '../Quote';

interface YouTubeSectionProps {
  mode: TimerMode;
  isTimerRunning: boolean;
  focusUrls: string[];
  breakUrls: string[];
  onSettingsSave: (settings: YouTubeSettingsType) => void;
}

// ランダムに1つ選択する関数
const getRandomUrl = (urls: string[]): string => {
  if (urls.length === 0) return '';
  const index = Math.floor(Math.random() * urls.length);
  return urls[index];
};

export const YouTubeSection: FC<YouTubeSectionProps> = ({
  mode,
  isTimerRunning,
  focusUrls,
  breakUrls,
  onSettingsSave,
}) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const prevRunningRef = useRef(false);
  const prevModeRef = useRef(mode);

  // タイマー開始時またはモード切替時にランダムでURLを選択
  useEffect(() => {
    const wasRunning = prevRunningRef.current;
    const prevMode = prevModeRef.current;

    // タイマーが開始された時、またはモードが変わった時
    if (isTimerRunning && (!wasRunning || mode !== prevMode)) {
      const urls = mode === 'focus' ? focusUrls : breakUrls;
      setCurrentUrl(getRandomUrl(urls));
    }

    prevRunningRef.current = isTimerRunning;
    prevModeRef.current = mode;
  }, [isTimerRunning, mode, focusUrls, breakUrls]);

  const currentUrls = mode === 'focus' ? focusUrls : breakUrls;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <span
            className={`text-sm font-medium ${
              mode === 'focus' ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {mode === 'focus' ? '集中用BGM' : '休憩用BGM'}
          </span>
          <span className="text-xs text-gray-400 ml-2">
            ({currentUrls.length}曲登録中)
          </span>
        </div>
        <YouTubeSettings
          focusUrls={focusUrls}
          breakUrls={breakUrls}
          onSave={onSettingsSave}
        />
      </div>

      <YouTubePlayer url={currentUrl} isPlaying={isTimerRunning} />

      {/* 名言表示（タイマー動作中のみ） */}
      {isTimerRunning && <QuoteDisplay intervalMs={300000} />}
    </div>
  );
};
