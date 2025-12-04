import { FC, useEffect, useRef, useCallback } from 'react';
import { extractVideoId } from '../../utils/youtubeUtils';

interface YouTubePlayerProps {
  url: string;
  isPlaying: boolean;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

const YOUTUBE_POSITION_KEY = 'pomodoro_youtube_position';
const YOUTUBE_VIDEO_KEY = 'pomodoro_youtube_video';

export const YouTubePlayer: FC<YouTubePlayerProps> = ({ url, isPlaying }) => {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoId = extractVideoId(url);
  const isApiReady = useRef(false);
  const isPlayerReady = useRef(false);
  // isPlayingの最新値を常に参照できるようにする
  const isPlayingRef = useRef(isPlaying);

  // 再生位置を保存
  const savePosition = useCallback(() => {
    if (playerRef.current && videoId) {
      try {
        const currentTime = playerRef.current.getCurrentTime();
        sessionStorage.setItem(YOUTUBE_POSITION_KEY, currentTime.toString());
        sessionStorage.setItem(YOUTUBE_VIDEO_KEY, videoId);
      } catch (e) {
        // Player might not be ready
      }
    }
  }, [videoId]);

  // 保存された再生位置を取得
  const getSavedPosition = useCallback((): number => {
    const savedVideo = sessionStorage.getItem(YOUTUBE_VIDEO_KEY);
    const savedPosition = sessionStorage.getItem(YOUTUBE_POSITION_KEY);
    if (savedVideo === videoId && savedPosition) {
      return parseFloat(savedPosition);
    }
    return 0;
  }, [videoId]);

  // YouTube API読み込み
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        isApiReady.current = true;
      };
    } else {
      isApiReady.current = true;
    }
  }, []);

  // プレイヤー初期化・破棄
  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }

      // 既存プレイヤーを破棄
      if (playerRef.current) {
        savePosition();
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          // Ignore
        }
        playerRef.current.destroy();
        playerRef.current = null;
        isPlayerReady.current = false;
      }

      // コンテナにIDを設定
      const playerId = 'youtube-player';
      containerRef.current!.innerHTML = `<div id="${playerId}"></div>`;

      const savedPosition = getSavedPosition();

      playerRef.current = new window.YT.Player(playerId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: videoId,
          start: Math.floor(savedPosition),
        },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            isPlayerReady.current = true;
            // iframeにスタイルを適用
            const iframe = containerRef.current?.querySelector('iframe');
            if (iframe) {
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.position = 'absolute';
              iframe.style.top = '0';
              iframe.style.left = '0';
            }
            // 保存位置にシーク
            if (savedPosition > 0) {
              event.target.seekTo(savedPosition, true);
            }
            // タイマーが動いていれば再生、そうでなければ停止
            if (isPlayingRef.current) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
          },
        },
      } as any);
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        savePosition();
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [videoId, getSavedPosition, savePosition]);

  // 再生/一時停止制御
  useEffect(() => {
    // isPlayingの最新値をrefに保持
    isPlayingRef.current = isPlaying;

    // playerRefがある場合はAPIで制御
    if (playerRef.current && isPlayerReady.current) {
      try {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          savePosition();
          playerRef.current.pauseVideo();
        }
      } catch (e) {
        // Player might not be ready yet
      }
    }

    // フォールバック: iframeに直接postMessageで停止命令を送る
    if (!isPlaying) {
      const iframe = containerRef.current?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          '*'
        );
      }
    }
  }, [isPlaying, savePosition]);

  // 定期的に再生位置を保存
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      savePosition();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, savePosition]);

  // ページ離脱時に保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      savePosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [savePosition]);

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">YouTube URLを設定してください</p>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black relative">
      <div ref={containerRef} className="absolute inset-0" />
      {!isPlaying && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-80 flex items-center justify-center pointer-events-none">
          <p className="text-gray-400">タイマー開始で再生されます</p>
        </div>
      )}
    </div>
  );
};
