import { FC, useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePomodoroContext } from '../../contexts/PomodoroContext';
import { extractVideoId } from '../../utils/youtubeUtils';

interface PlayerRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// YTPlayer型（YouTubePlayer.tsxのグローバル定義を利用）
interface YTPlayerExtended {
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
  getIframe?: () => HTMLIFrameElement;
}

// グローバル変数でプレイヤーを永続化
let globalPlayer: YTPlayerExtended | null = null;
let globalVideoId: string | null = null;
let globalContainer: HTMLDivElement | null = null;
let isPlayerReady = false;
let pendingPlayState: boolean | null = null;

const YOUTUBE_POSITION_KEY = 'pomodoro_youtube_position';
const YOUTUBE_VIDEO_KEY = 'pomodoro_youtube_video';

// HMR/リロード時にグローバル変数をリセット
function resetGlobalState() {
  globalPlayer = null;
  globalVideoId = null;
  globalContainer = null;
  isPlayerReady = false;
  pendingPlayState = null;
}

function ensureContainer(): HTMLDivElement | null {
  const portalRoot = document.getElementById('youtube-player-root');
  if (!portalRoot) return null;

  // 既存のコンテナがあるがglobalContainerがnullの場合（HMR/リロード後）
  const existingContainer = document.getElementById('youtube-player-container');
  if (existingContainer && !globalContainer) {
    // 古いコンテナを削除してグローバル状態をリセット
    existingContainer.remove();
    resetGlobalState();
  }

  if (!globalContainer || !globalContainer.parentElement) {
    globalContainer = document.createElement('div');
    globalContainer.id = 'youtube-player-container';
    globalContainer.className = 'youtube-position-mini';

    const playerDiv = document.createElement('div');
    playerDiv.id = 'youtube-player-element';
    playerDiv.className = 'w-full h-full rounded-lg overflow-hidden bg-black';
    globalContainer.appendChild(playerDiv);

    portalRoot.appendChild(globalContainer);
  }
  return globalContainer;
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (existingCallback) existingCallback();
      resolve();
    };

    if (!document.getElementById('youtube-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  });
}

function getSavedPosition(videoId: string): number {
  const savedVideo = sessionStorage.getItem(YOUTUBE_VIDEO_KEY);
  const savedPosition = sessionStorage.getItem(YOUTUBE_POSITION_KEY);
  if (savedVideo === videoId && savedPosition) {
    return parseFloat(savedPosition);
  }
  return 0;
}

function savePosition() {
  if (globalPlayer && globalVideoId && isPlayerReady) {
    try {
      const currentTime = globalPlayer.getCurrentTime();
      sessionStorage.setItem(YOUTUBE_POSITION_KEY, currentTime.toString());
      sessionStorage.setItem(YOUTUBE_VIDEO_KEY, globalVideoId);
    } catch (e) {
      // Player might not be ready
    }
  }
}

async function initPlayer(videoId: string, shouldPlay: boolean) {
  await loadYouTubeAPI();

  const container = ensureContainer();
  if (!container) return;

  // 同じvideoIdで既にプレイヤーが存在する場合はスキップ
  if (globalPlayer && globalVideoId === videoId) {
    // 再生/停止の状態だけ更新
    if (isPlayerReady) {
      if (shouldPlay) {
        globalPlayer.playVideo();
      } else {
        globalPlayer.pauseVideo();
      }
    } else {
      pendingPlayState = shouldPlay;
    }
    return;
  }

  // 既存プレイヤーを破棄（videoIdが変わった場合）
  if (globalPlayer) {
    savePosition();
    try {
      globalPlayer.destroy();
    } catch (e) {
      // Ignore
    }
    globalPlayer = null;
    globalVideoId = null;
    isPlayerReady = false;
  }

  // プレイヤー要素を再作成
  const playerElement = container.querySelector('#youtube-player-element');
  if (playerElement) {
    playerElement.innerHTML = '<div id="yt-player"></div>';
  }

  const savedPosition = getSavedPosition(videoId);
  pendingPlayState = shouldPlay;

  globalPlayer = new window.YT.Player('yt-player', {
    videoId,
    playerVars: {
      autoplay: 0,
      loop: 1,
      playlist: videoId,
      start: Math.floor(savedPosition),
    },
    events: {
      onReady: (event: { target: YTPlayerExtended }) => {
        isPlayerReady = true;
        globalVideoId = videoId;

        // iframeにスタイルを適用
        const iframe = container.querySelector('iframe');
        if (iframe) {
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.position = 'absolute';
          iframe.style.top = '0';
          iframe.style.left = '0';
        }

        // 待機中の再生状態を適用
        // 注意: 停止中にpauseVideo()を呼ぶとYouTubeがバッファリング状態で止まるため、
        // 再生する場合のみplayVideo()を呼び、停止中は何もしない（autoplay=0で停止状態）
        if (pendingPlayState) {
          // 保存位置にシーク（再生時のみ）
          if (savedPosition > 0) {
            event.target.seekTo(savedPosition, true);
          }
          event.target.playVideo();
        }
        // 停止中は何もしない - autoplay=0とstart=XXで既に正しい位置で停止状態
        pendingPlayState = null;
      },
    },
  } as any) as YTPlayerExtended;
}

function updateContainerPosition(
  isHomePage: boolean,
  homeRect: PlayerRect | null,
  hasUrl: boolean
) {
  if (!globalContainer) return;

  if (!hasUrl) {
    globalContainer.className = 'youtube-position-hidden';
    return;
  }

  if (isHomePage && homeRect) {
    globalContainer.className = 'youtube-position-home';
    globalContainer.style.top = `${homeRect.top}px`;
    globalContainer.style.left = `${homeRect.left}px`;
    globalContainer.style.width = `${homeRect.width}px`;
    globalContainer.style.height = `${homeRect.height}px`;
  } else {
    globalContainer.className = 'youtube-position-mini';
    globalContainer.style.top = '';
    globalContainer.style.left = '';
    globalContainer.style.width = '';
    globalContainer.style.height = '';
  }
}

function updatePlayState(shouldPlay: boolean) {
  if (!globalPlayer) return;

  if (isPlayerReady) {
    try {
      if (shouldPlay) {
        globalPlayer.playVideo();
      } else {
        savePosition();
        globalPlayer.pauseVideo();
      }
    } catch (e) {
      // Ignore
    }
  } else {
    pendingPlayState = shouldPlay;
  }
}

export const YouTubePlayerPortal: FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { youtubeUrl, isRunning } = usePomodoroContext();
  const [homeRect, setHomeRect] = useState<PlayerRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;

  // ホームページのプレースホルダー位置を追跡
  const updateHomeRect = useCallback(() => {
    const target = document.getElementById('youtube-player-portal');
    if (target) {
      const rect = target.getBoundingClientRect();
      setHomeRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setHomeRect(null);
      return;
    }

    // DOMが準備できるまでリトライ
    let retryCount = 0;
    const checkAndUpdate = () => {
      const target = document.getElementById('youtube-player-portal');
      if (target) {
        updateHomeRect();
        if (retryCount < 20) {
          retryCount++;
          setTimeout(checkAndUpdate, 50);
        }
      } else {
        setTimeout(checkAndUpdate, 50);
      }
    };
    checkAndUpdate();

    const handleResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateHomeRect);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isHomePage, updateHomeRect]);

  // プレイヤー初期化（URLが変わったときのみ）
  useEffect(() => {
    if (!videoId) return;

    // 初回または動画が変わった場合のみ初期化
    if (prevUrlRef.current !== videoId) {
      prevUrlRef.current = videoId;
      initPlayer(videoId, isRunning);
    }
  }, [videoId, isRunning]);

  // 再生状態の更新
  useEffect(() => {
    updatePlayState(isRunning);
  }, [isRunning]);

  // コンテナ位置の更新
  useEffect(() => {
    updateContainerPosition(isHomePage, homeRect, !!youtubeUrl);
  }, [isHomePage, homeRect, youtubeUrl]);

  // 定期的に再生位置を保存
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(savePosition, 5000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // ページ離脱時に保存
  useEffect(() => {
    window.addEventListener('beforeunload', savePosition);
    return () => window.removeEventListener('beforeunload', savePosition);
  }, []);

  // このコンポーネント自体は何もレンダリングしない
  return null;
};
