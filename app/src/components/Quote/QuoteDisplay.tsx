import { FC, useState, useEffect, useCallback } from 'react';
import { Quote } from '../../types';
import { fetchQuotes } from '../../api/dataApi';

interface QuoteDisplayProps {
  intervalMs?: number;  // 名言切り替え間隔（ミリ秒）
}

export const QuoteDisplay: FC<QuoteDisplayProps> = ({
  intervalMs = 10000,  // デフォルト10秒
}) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const data = await fetchQuotes();
        // シャッフル
        const shuffled = [...data.quotes].sort(() => Math.random() - 0.5);
        setQuotes(shuffled);
      } catch (error) {
        console.error('Failed to load quotes:', error);
      }
    };
    loadQuotes();
  }, []);

  const nextQuote = useCallback(() => {
    // フェードアウト
    setIsVisible(false);

    // 500ms後に次の名言に切り替えてフェードイン
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
      setIsVisible(true);
    }, 500);
  }, [quotes.length]);

  useEffect(() => {
    if (quotes.length === 0) return;

    const timer = setInterval(nextQuote, intervalMs);
    return () => clearInterval(timer);
  }, [quotes.length, intervalMs, nextQuote]);

  if (quotes.length === 0) {
    return null;
  }

  const currentQuote = quotes[currentIndex];

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
      <div
        className={`transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* 将来の顔写真用スペース */}
          {currentQuote.imageUrl && (
            <img
              src={currentQuote.imageUrl}
              alt={currentQuote.author}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <p className="text-gray-700 italic leading-relaxed">
              "{currentQuote.message}"
            </p>
            <p className="mt-2 text-sm text-gray-500 text-right">
              — {currentQuote.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
