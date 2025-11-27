import { FC } from 'react';
import { extractVideoId, getEmbedUrl } from '../../utils/youtubeUtils';

interface YouTubePlayerProps {
  url: string;
  isPlaying: boolean;
}

export const YouTubePlayer: FC<YouTubePlayerProps> = ({ url, isPlaying }) => {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">YouTube URLを設定してください</p>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">タイマー開始で再生されます</p>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        src={getEmbedUrl(videoId)}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};
