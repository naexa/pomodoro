import { FC, useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { fetchDailyLog, DailyLogResponse } from '../api/dataApi';
import { formatDate } from '../utils/dateUtils';

export const DailyLogPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return dateParam || formatDate(new Date());
  });
  const [logData, setLogData] = useState<DailyLogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLog = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchDailyLog(selectedDate);
      setLogData(data);
    } catch (error) {
      console.error('Failed to load daily log:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  // ウィンドウにフォーカスが戻った時にデータを再取得
  useEffect(() => {
    const handleFocus = () => {
      loadLog(false); // ローディング表示なしで更新
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadLog]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSearchParams({ date });
  };

  const goToPrevDay = () => {
    const prev = subDays(parseISO(selectedDate), 1);
    handleDateChange(formatDate(prev));
  };

  const goToNextDay = () => {
    const next = addDays(parseISO(selectedDate), 1);
    const today = formatDate(new Date());
    if (formatDate(next) <= today) {
      handleDateChange(formatDate(next));
    }
  };

  const isToday = selectedDate === formatDate(new Date());
  const displayDate = format(parseISO(selectedDate), 'yyyy年M月d日 (E)', { locale: ja });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            <span>←</span>
            <span>タイマーに戻る</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Daily Log</h1>
          <div className="w-24" /> {/* Spacer */}
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevDay}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              ← 前日
            </button>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                max={formatDate(new Date())}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <span className="text-lg font-medium text-gray-700">
                {displayDate}
              </span>
            </div>

            <button
              onClick={goToNextDay}
              disabled={isToday}
              className={`px-4 py-2 rounded-lg transition ${
                isToday
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              翌日 →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : logData ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">サマリー</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {logData.calendarEntry.completedCount}
                  </div>
                  <div className="text-sm text-green-700">完了タスク</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {logData.calendarEntry.pomodoroCount}
                  </div>
                  <div className="text-sm text-red-700">ポモドーロ</div>
                </div>
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                完了タスク一覧
              </h2>
              {logData.tasks.length > 0 ? (
                <ul className="space-y-2">
                  {logData.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-green-500">✓</span>
                      <span className="flex-1">{task.title}</span>
                      {task.completedAt && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(task.completedAt), 'HH:mm')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  この日の完了タスクはありません
                </p>
              )}
            </div>

            {/* Reflection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                振り返り・意識ポイント
              </h2>
              {logData.reflection ? (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {logData.reflection.content}
                  </p>
                  <div className="mt-2 text-xs text-gray-400">
                    記録日: {format(new Date(logData.reflection.createdAt), 'yyyy/MM/dd HH:mm')}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  この日の振り返りはありません
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            データが見つかりません
          </div>
        )}
      </div>
    </div>
  );
};
