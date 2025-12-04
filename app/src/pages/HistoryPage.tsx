import { FC, useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { fetchTaskHistory } from '../api/dataApi';
import { Task, TaskHistoryData } from '../types';
import { CategoryBadge } from '../components/Category';
import { useCategories } from '../hooks/useCategories';

const ITEMS_PER_PAGE = 10; // 1ページあたりの日数

interface DayEntry {
  date: string;
  tasks: Task[];
}

export const HistoryPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [historyData, setHistoryData] = useState<TaskHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { categories } = useCategories();

  // URLパラメータから状態を取得
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';

  // データ取得
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await fetchTaskHistory();
        setHistoryData(data);
      } catch (error) {
        console.error('Failed to load task history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  // 日付でソートしたエントリ配列を作成
  const sortedEntries = useMemo<DayEntry[]>(() => {
    if (!historyData?.tasks) return [];

    const entries = Object.entries(historyData.tasks)
      .map(([date, tasks]) => ({ date, tasks }))
      .sort((a, b) => b.date.localeCompare(a.date)); // 降順（新しい順）

    return entries;
  }, [historyData]);

  // フィルタ適用
  const filteredEntries = useMemo(() => {
    let result = sortedEntries;

    if (fromDate) {
      result = result.filter(entry => entry.date >= fromDate);
    }
    if (toDate) {
      result = result.filter(entry => entry.date <= toDate);
    }

    return result;
  }, [sortedEntries, fromDate, toDate]);

  // ページネーション
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  // 総タスク数
  const totalTasks = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => sum + entry.tasks.length, 0);
  }, [filteredEntries]);

  // URLパラメータ更新
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  };

  const handleFromDateChange = (value: string) => {
    updateParams({ from: value, page: '1' });
  };

  const handleToDateChange = (value: string) => {
    updateParams({ to: value, page: '1' });
  };

  const handleResetFilter = () => {
    updateParams({ from: null, to: null, page: '1' });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page: page.toString() });
  };

  // ページネーションボタンの表示範囲
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

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
          <h1 className="text-2xl font-bold text-gray-800">タスク履歴</h1>
          <div className="w-24" />
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">期間:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              />
              <span className="text-gray-400">〜</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={handleResetFilter}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                リセット
              </button>
            )}
            <div className="ml-auto text-sm text-gray-500">
              {filteredEntries.length}日 / {totalTasks}件
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : paginatedEntries.length > 0 ? (
          <div className="space-y-4">
            {paginatedEntries.map((entry) => (
              <div key={entry.date} className="bg-white rounded-lg shadow p-4">
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3 pb-2 border-b">
                  <span className="text-lg font-semibold text-gray-800">
                    {format(parseISO(entry.date), 'yyyy年M月d日 (E)', { locale: ja })}
                  </span>
                  <span className="text-sm text-gray-500">
                    {entry.tasks.length}件
                  </span>
                </div>

                {/* Tasks */}
                <ul className="space-y-2">
                  {entry.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-green-500">✓</span>
                      <span className="flex-1 text-gray-700">{task.title}</span>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {sortedEntries.length === 0
              ? 'タスク履歴がありません'
              : '指定した期間にタスク履歴がありません'}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              ← 前へ
            </button>

            {getPageNumbers().map((page, index) =>
              page === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg text-sm ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              次へ →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
