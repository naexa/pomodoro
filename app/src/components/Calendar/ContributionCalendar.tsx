import { FC, useMemo } from 'react';
import { CalendarData } from '../../types';
import { CalendarCell } from './CalendarCell';
import { getCalendarDays, formatDate } from '../../utils/dateUtils';
import { format } from 'date-fns';

interface ContributionCalendarProps {
  data: CalendarData;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ContributionCalendar: FC<ContributionCalendarProps> = ({ data }) => {
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
        <span className="text-xs text-gray-400">
          ※ 色はポモドーロ完了数で決まります（0→1-2→3-4→5-6→7+）
        </span>
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
    </div>
  );
};
