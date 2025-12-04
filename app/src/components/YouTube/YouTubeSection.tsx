import { FC } from 'react';
import { TimerMode, YouTubeSettings as YouTubeSettingsType } from '../../types';
import { YouTubeSettings } from './YouTubeSettings';
import { QuoteDisplay } from '../Quote';
import { usePomodoroContext } from '../../contexts/PomodoroContext';

interface YouTubeSectionProps {
  mode: TimerMode;
  focusUrls: string[];
  breakUrls: string[];
  onSettingsSave: (settings: YouTubeSettingsType) => void;
}

export const YouTubeSection: FC<YouTubeSectionProps> = ({
  mode,
  focusUrls,
  breakUrls,
  onSettingsSave,
}) => {
  const { switchToNextSong } = usePomodoroContext();

  const currentUrls = mode === 'focus' ? focusUrls : breakUrls;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <span
            className={`text-sm font-medium ${mode === 'focus' ? 'text-red-500' : 'text-green-500'
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
              onClick={switchToNextSong}
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

      {/* YouTubeプレイヤー用プレースホルダー - AppLayoutからportalで挿入される */}
      <div id="youtube-player-portal" className="aspect-video rounded-lg overflow-hidden bg-black" />

      {/* 名言表示（常に表示） */}
      <div className="pt-4 border-t border-gray-100">
        <QuoteDisplay intervalMs={300000} />
      </div>
    </div>
  );
};
