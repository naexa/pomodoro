import { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { FloatingMiniPlayer } from '../components/MiniPlayer';
import { YouTubePlayerPortal } from '../components/YouTube/YouTubePlayerPortal';
import { usePomodoroContext } from '../contexts/PomodoroContext';

interface AppLayoutProps {
  children: ReactNode;
}

// ミニプレイヤーのサイズ定数
const MINI_PLAYER_WIDTH = 280;
const MINI_PLAYER_VIDEO_HEIGHT = 84;
const MINI_PLAYER_BOTTOM = 16;
const MINI_PLAYER_RIGHT = 16;

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { youtubeUrl, mode, settings } = usePomodoroContext();

  // 現在のモードのURL数
  const currentUrls = mode === 'focus' ? settings.youtube.focusUrls : settings.youtube.breakUrls;

  return (
    <>
      {children}

      {/* YouTubeプレイヤー - Portal経由でbody直下に描画 */}
      <YouTubePlayerPortal />

      {/* ミニプレイヤー（タイマー部分 + YouTube枠）- 非ホームページで表示 */}
      {!isHomePage && (
        <div
          className={`fixed z-50 bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-in ${
            mode === 'focus' ? 'border-primary/30' : 'border-green-500/30'
          } border`}
          style={{
            bottom: MINI_PLAYER_BOTTOM,
            right: MINI_PLAYER_RIGHT,
            width: MINI_PLAYER_WIDTH,
          }}
        >
          <FloatingMiniPlayer />

          {/* YouTubeプレイヤー表示エリア */}
          {youtubeUrl && (
            <div className="p-2 bg-gray-50">
              <div className="space-y-1">
                {/* プレイヤー用スペース（実際のプレイヤーは上のdivで重ねて配置） */}
                <div
                  className="rounded-lg bg-black"
                  style={{ width: '100%', height: MINI_PLAYER_VIDEO_HEIGHT }}
                />
                <div className="flex items-center justify-between px-1">
                  <span className={`text-xs ${mode === 'focus' ? 'text-primary' : 'text-green-500'}`}>
                    {mode === 'focus' ? '集中用BGM' : '休憩用BGM'}
                  </span>
                  <span className="text-xs text-text-muted">
                    {currentUrls.length}曲登録中
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
