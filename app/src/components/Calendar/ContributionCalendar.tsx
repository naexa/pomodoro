import { FC, useMemo, useState } from 'react';
import { CalendarData, CalendarThresholds } from '../../types';
import { CalendarCell } from './CalendarCell';
import { getCalendarDays, formatDate, DEFAULT_CALENDAR_THRESHOLDS } from '../../utils/dateUtils';

interface ContributionCalendarProps {
  data: CalendarData;
  thresholds?: CalendarThresholds;
  onThresholdsChange?: (thresholds: CalendarThresholds) => void;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ContributionCalendar: FC<ContributionCalendarProps> = ({ data, thresholds, onThresholdsChange }) => {
  const [showSettings, setShowSettings] = useState(false);
  const currentThresholds = thresholds || DEFAULT_CALENDAR_THRESHOLDS;
  const days = getCalendarDays(52);

  // Group days by week (columns)
  const weeks: (Date | null)[][] = useMemo(() => {
    const result: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // Fill in empty cells for the first week if needed
    if (days.length > 0) {
      const firstDayOfWeek = days[0].getDay();
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }
    }

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [days]);

  // Calculate total contributions
  const totalContributions = useMemo(() => {
    return Object.values(data.entries).reduce((sum, entry) => sum + (entry.pomodoroCount || 0), 0);
  }, [data]);

  // Get month labels with their positions
  const monthPositions = useMemo(() => {
    const positions: { month: number; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDay = week.find(d => d !== null);
      if (firstDay) {
        const month = firstDay.getMonth();
        if (month !== lastMonth) {
          positions.push({ month, weekIndex });
          lastMonth = month;
        }
      }
    });

    return positions;
  }, [weeks]);

  return (
    <div className="p-5 rounded-lg bg-white shadow">
      {/* Stats header */}
      <div className="mb-4 text-sm text-gray-700">
        <span className="font-semibold">{totalContributions} contributions</span>
        <span className="text-gray-500"> in the last year</span>
      </div>

      {/* Calendar container */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: '800px' }}>
          {/* Month labels */}
          <div className="flex mb-2" style={{ paddingLeft: '32px' }}>
            {monthPositions.map(({ month, weekIndex }, index) => {
              const nextPosition = monthPositions[index + 1]?.weekIndex || weeks.length;
              const width = (nextPosition - weekIndex) * 14; // 10px cell + 4px gap
              return (
                <div
                  key={`${month}-${weekIndex}`}
                  className="text-gray-500"
                  style={{
                    width: `${width}px`,
                    fontSize: '12px',
                  }}
                >
                  {MONTH_LABELS[month]}
                </div>
              );
            })}
          </div>

          {/* Main grid with weekday labels */}
          <div className="flex">
            {/* Weekday labels */}
            <div className="flex flex-col" style={{ width: '32px', gap: '4px' }}>
              {WEEKDAY_LABELS.map((day, index) => (
                <div
                  key={day}
                  className="text-gray-500"
                  style={{
                    height: '10px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {index === 1 || index === 3 || index === 5 ? day : ''}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex" style={{ gap: '4px' }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col" style={{ gap: '4px' }}>
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${dayIndex}`}
                          style={{
                            width: '10px',
                            height: '10px',
                          }}
                        />
                      );
                    }
                    const dateStr = formatDate(day);
                    const entry = data.entries[dateStr];
                    return (
                      <CalendarCell
                        key={dateStr}
                        date={day}
                        pomodoroCount={entry?.pomodoroCount || 0}
                        completedCount={entry?.completedCount || 0}
                        thresholds={currentThresholds}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            ※ 色はポモドーロ完了数で決まります（0→{currentThresholds.level1}→{currentThresholds.level2}→{currentThresholds.level3}→{currentThresholds.level4}+）
          </span>
          {onThresholdsChange && (
            <button
              onClick={() => setShowSettings(true)}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              設定
            </button>
          )}
        </div>
        <div className="flex items-center text-gray-500" style={{ gap: '4px' }}>
          <span style={{ fontSize: '11px', marginRight: '4px' }}>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'][level],
              }}
            />
          ))}
          <span style={{ fontSize: '11px', marginLeft: '4px' }}>More</span>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && onThresholdsChange && (
        <CalendarThresholdsModal
          thresholds={currentThresholds}
          onSave={(newThresholds) => {
            onThresholdsChange(newThresholds);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

// しきい値設定モーダル
const CalendarThresholdsModal: FC<{
  thresholds: CalendarThresholds;
  onSave: (thresholds: CalendarThresholds) => void;
  onClose: () => void;
}> = ({ thresholds, onSave, onClose }) => {
  const [level1, setLevel1] = useState(thresholds.level1);
  const [level2, setLevel2] = useState(thresholds.level2);
  const [level3, setLevel3] = useState(thresholds.level3);
  const [level4, setLevel4] = useState(thresholds.level4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ level1, level2, level3, level4 });
  };

  const LEVEL_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">カレンダー色設定</h3>
        <p className="text-sm text-gray-500 mb-4">
          何ポモドーロ以上で色が変わるかを設定できます
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {[
              { level: 1, value: level1, setValue: setLevel1, color: LEVEL_COLORS[1] },
              { level: 2, value: level2, setValue: setLevel2, color: LEVEL_COLORS[2] },
              { level: 3, value: level3, setValue: setLevel3, color: LEVEL_COLORS[3] },
              { level: 4, value: level4, setValue: setLevel4, color: LEVEL_COLORS[4] },
            ].map(({ level, value, setValue, color }) => (
              <div key={level} className="flex items-center gap-3">
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '3px',
                    backgroundColor: color,
                  }}
                />
                <label className="text-sm text-gray-600 w-16">Level {level}</label>
                <input
                  type="number"
                  min={1}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-20 px-2 py-1 border rounded text-center"
                />
                <span className="text-sm text-gray-500">回以上</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
