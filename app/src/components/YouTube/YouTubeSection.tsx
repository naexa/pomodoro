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

// ランダムに1つ選択する関数（現在のURLを除外して選択）
const getRandomUrl = (urls: string[], excludeUrl?: string): string => {
  if (urls.length === 0) return '';
  if (urls.length === 1) return urls[0];

  // 現在のURLを除外した候補から選ぶ
  const candidates = excludeUrl ? urls.filter(url => url !== excludeUrl) : urls;
  if (candidates.length === 0) return urls[0];

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
};

export const YouTubeSection: FC<YouTubeSectionProps> = ({
  mode,
  isTimerRunning,
  focusUrls,
  breakUrls,
  onSettingsSave,
}) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const prevModeRef = useRef(mode);

  // モードが変わった時だけランダムでURLを選択（一時停止→再開では変えない）
  useEffect(() => {
    const prevMode = prevModeRef.current;

    // モードが変わった時のみ新しいURLを選択
    if (mode !== prevMode) {
      const urls = mode === 'focus' ? focusUrls : breakUrls;
      setCurrentUrl(getRandomUrl(urls));
      prevModeRef.current = mode;
    }
  }, [mode, focusUrls, breakUrls]);

  // 初回またはURLsが読み込まれた時にURLを設定
  useEffect(() => {
    if (!currentUrl) {
      const urls = mode === 'focus' ? focusUrls : breakUrls;
      if (urls.length > 0) {
        setCurrentUrl(getRandomUrl(urls));
      }
    }
  }, [focusUrls, breakUrls, mode, currentUrl]);

  const currentUrls = mode === 'focus' ? focusUrls : breakUrls;

  // 別の曲に切り替える
  const handleSwitchSong = () => {
    const urls = mode === 'focus' ? focusUrls : breakUrls;
    const newUrl = getRandomUrl(urls, currentUrl);
    setCurrentUrl(newUrl);
  };

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
        <div className="flex items-center gap-2">
          {/* 曲切り替えボタン（2曲以上登録時のみ表示） */}
          {currentUrls.length > 1 && (
            <button
              onClick={handleSwitchSong}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition flex items-center gap-1"
              title="別の曲に切り替え"
            >
              <span>↻</span>
              <span>次の曲</span>
            </button>
          )}
          <YouTubeSettings
            focusUrls={focusUrls}
            breakUrls={breakUrls}
            onSave={onSettingsSave}
          />
        </div>
      </div>

      <YouTubePlayer url={currentUrl} isPlaying={isTimerRunning} />

      {/* 名言表示（タイマー動作中のみ） */}
      {isTimerRunning && <QuoteDisplay intervalMs={300000} />}
    </div>
  );
};
