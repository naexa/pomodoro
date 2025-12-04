import { FC, useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { fetchDailyLog, DailyLogResponse, fetchDailyStats, fetchMonthlyStats } from '../api/dataApi';
import { formatDate } from '../utils/dateUtils';
import { YearlyCalendar } from '../components/Calendar';
import { useCalendar } from '../hooks/useCalendar';
import { CategoryBadge } from '../components/Category';
import { DailyStats, MonthlyStats } from '../types';
import { useCategories, getCategoryColorClasses } from '../hooks/useCategories';

export const DailyLogPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return dateParam || formatDate(new Date());
  });
  const [logData, setLogData] = useState<DailyLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [showMonthly, setShowMonthly] = useState(false);
  const { data: calendarData } = useCalendar();
  const { categories } = useCategories();

  const loadLog = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [data, stats] = await Promise.all([
        fetchDailyLog(selectedDate),
        fetchDailyStats(selectedDate),
      ]);
      setLogData(data);
      setDailyStats(stats);

      // 月別統計も取得
      const month = selectedDate.substring(0, 7); // "2025-12"
      const monthly = await fetchMonthlyStats(month);
      setMonthlyStats(monthly);
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
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
                      {task.categoryId && categories.find(c => c.id === task.categoryId) && (
                        <CategoryBadge
                          category={categories.find(c => c.id === task.categoryId)!}
                        />
                      )}
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

            {/* Category Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  カテゴリ別集計
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMonthly(false)}
                    className={`px-3 py-1 text-sm rounded-lg transition ${
                      !showMonthly
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    日別
                  </button>
                  <button
                    onClick={() => setShowMonthly(true)}
                    className={`px-3 py-1 text-sm rounded-lg transition ${
                      showMonthly
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    月別
                  </button>
                </div>
              </div>

              {!showMonthly ? (
                // 日別統計
                <div>
                  {dailyStats && (dailyStats.categories.length > 0 || dailyStats.uncategorizedCount > 0) ? (
                    (() => {
                      const totalCount = dailyStats.categories.reduce((sum, c) => sum + c.completedCount, 0) + dailyStats.uncategorizedCount;
                      const allItems = [
                        ...dailyStats.categories.map(stat => ({
                          id: stat.categoryId,
                          name: stat.categoryName,
                          count: stat.completedCount,
                          color: stat.color,
                          isUncategorized: false,
                        })),
                        ...(dailyStats.uncategorizedCount > 0 ? [{
                          id: 'uncategorized',
                          name: '未分類',
                          count: dailyStats.uncategorizedCount,
                          color: 'gray',
                          isUncategorized: true,
                        }] : []),
                      ].sort((a, b) => b.count - a.count);

                      return (
                        <div className="space-y-4">
                          {/* 円グラフ風の表示 */}
                          <div className="flex items-center justify-center gap-6">
                            <div className="relative w-32 h-32">
                              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                {(() => {
                                  let cumulative = 0;
                                  return allItems.map((item, index) => {
                                    const percent = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                                    const strokeDasharray = `${percent} ${100 - percent}`;
                                    const strokeDashoffset = -cumulative;
                                    cumulative += percent;
                                    const colorMap: Record<string, string> = {
                                      red: '#ef4444', orange: '#f97316', yellow: '#eab308',
                                      green: '#22c55e', blue: '#3b82f6', purple: '#a855f7',
                                      pink: '#ec4899', indigo: '#6366f1', teal: '#14b8a6',
                                      cyan: '#06b6d4', gray: '#9ca3af',
                                    };
                                    return (
                                      <circle
                                        key={item.id}
                                        cx="18" cy="18" r="15.9155"
                                        fill="transparent"
                                        stroke={colorMap[item.color] || '#9ca3af'}
                                        strokeWidth="3.5"
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        className="transition-all duration-300"
                                      />
                                    );
                                  });
                                })()}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-800">{totalCount}</div>
                                  <div className="text-xs text-gray-500">件</div>
                                </div>
                              </div>
                            </div>
                            {/* 凡例 */}
                            <div className="space-y-1">
                              {allItems.map((item) => {
                                const colors = item.isUncategorized
                                  ? { bg: 'bg-gray-200', border: 'border-gray-300' }
                                  : getCategoryColorClasses(item.color);
                                const percent = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                                return (
                                  <div key={item.id} className="flex items-center gap-2 text-sm">
                                    <span className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`} />
                                    <span className="text-gray-600">{item.name}</span>
                                    <span className="font-medium text-gray-800">{item.count}</span>
                                    <span className="text-gray-400">({percent}%)</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 横棒グラフ */}
                          <div className="space-y-2 mt-4">
                            {allItems.map((item) => {
                              const colors = item.isUncategorized
                                ? { bg: 'bg-gray-300', text: 'text-gray-600' }
                                : getCategoryColorClasses(item.color);
                              const percent = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                              return (
                                <div key={item.id} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className={item.isUncategorized ? 'text-gray-500' : 'text-gray-700'}>
                                      {item.name}
                                    </span>
                                    <span className="font-medium text-gray-800">{item.count} 件</span>
                                  </div>
                                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      この日のカテゴリ別集計はありません
                    </p>
                  )}
                </div>
              ) : (
                // 月別統計
                <div>
                  {monthlyStats && (monthlyStats.categories.length > 0 || monthlyStats.uncategorizedCount > 0) ? (
                    (() => {
                      const totalCount = monthlyStats.categories.reduce((sum, c) => sum + c.completedCount, 0) + monthlyStats.uncategorizedCount;
                      const allItems = [
                        ...monthlyStats.categories.map(stat => ({
                          id: stat.categoryId,
                          name: stat.categoryName,
                          count: stat.completedCount,
                          color: stat.color,
                          isUncategorized: false,
                        })),
                        ...(monthlyStats.uncategorizedCount > 0 ? [{
                          id: 'uncategorized',
                          name: '未分類',
                          count: monthlyStats.uncategorizedCount,
                          color: 'gray',
                          isUncategorized: true,
                        }] : []),
                      ].sort((a, b) => b.count - a.count);

                      return (
                        <div className="space-y-4">
                          <div className="text-sm text-gray-500 text-center mb-2">
                            {format(parseISO(selectedDate), 'yyyy年M月', { locale: ja })} の集計
                          </div>

                          {/* 円グラフ風の表示 */}
                          <div className="flex items-center justify-center gap-6">
                            <div className="relative w-32 h-32">
                              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                {(() => {
                                  let cumulative = 0;
                                  return allItems.map((item) => {
                                    const percent = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                                    const strokeDasharray = `${percent} ${100 - percent}`;
                                    const strokeDashoffset = -cumulative;
                                    cumulative += percent;
                                    const colorMap: Record<string, string> = {
                                      red: '#ef4444', orange: '#f97316', yellow: '#eab308',
                                      green: '#22c55e', blue: '#3b82f6', purple: '#a855f7',
                                      pink: '#ec4899', indigo: '#6366f1', teal: '#14b8a6',
                                      cyan: '#06b6d4', gray: '#9ca3af',
                                    };
                                    return (
                                      <circle
                                        key={item.id}
                                        cx="18" cy="18" r="15.9155"
                                        fill="transparent"
                                        stroke={colorMap[item.color] || '#9ca3af'}
                                        strokeWidth="3.5"
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        className="transition-all duration-300"
                                      />
                                    );
                                  });
                                })()}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-800">{totalCount}</div>
                                  <div className="text-xs text-gray-500">件</div>
                                </div>
                              </div>
                            </div>
                            {/* 凡例 */}
                            <div className="space-y-1">
                              {allItems.map((item) => {
                                const colors = item.isUncategorized
                                  ? { bg: 'bg-gray-200', border: 'border-gray-300' }
                                  : getCategoryColorClasses(item.color);
                                const percent = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                                return (
                                  <div key={item.id} className="flex items-center gap-2 text-sm">
                                    <span className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`} />
                                    <span className="text-gray-600">{item.name}</span>
                                    <span className="font-medium text-gray-800">{item.count}</span>
                                    <span className="text-gray-400">({percent}%)</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 横棒グラフ */}
                          <div className="space-y-2 mt-4">
                            {allItems.map((item) => {
                              const colors = item.isUncategorized
                                ? { bg: 'bg-gray-300', text: 'text-gray-600' }
                                : getCategoryColorClasses(item.color);
                              const percent = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                              return (
                                <div key={item.id} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className={item.isUncategorized ? 'text-gray-500' : 'text-gray-700'}>
                                      {item.name}
                                    </span>
                                    <span className="font-medium text-gray-800">{item.count} 件</span>
                                  </div>
                                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* 日別内訳 */}
                          {monthlyStats.dailyBreakdown.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <h3 className="text-sm font-medium text-gray-600 mb-3">日別内訳</h3>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {monthlyStats.dailyBreakdown.map((day) => (
                                  <div
                                    key={day.date}
                                    className="flex items-center gap-3 p-2 rounded bg-gray-50 text-sm"
                                  >
                                    <span className="w-20 text-gray-500">
                                      {format(parseISO(day.date), 'M/d (E)', { locale: ja })}
                                    </span>
                                    <div className="flex-1 flex flex-wrap gap-1">
                                      {day.categories.map((cat) => {
                                        const colors = getCategoryColorClasses(cat.color);
                                        return (
                                          <span
                                            key={cat.categoryId}
                                            className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}
                                          >
                                            {cat.categoryName}: {cat.completedCount}
                                          </span>
                                        );
                                      })}
                                      {day.uncategorizedCount > 0 && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
                                          未分類: {day.uncategorizedCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      この月のカテゴリ別集計はありません
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            データが見つかりません
          </div>
        )}

        {/* Yearly Calendar */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Contribution Calendar</h2>
          <YearlyCalendar
            data={calendarData}
            onDateSelect={handleDateChange}
          />
        </div>
      </div>
    </div>
  );
};
