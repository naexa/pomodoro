import { FC } from 'react';
import { CalendarData } from '../../types';
import { CalendarCell } from './CalendarCell';
import { getCalendarDays, formatDate } from '../../utils/dateUtils';
import { format } from 'date-fns';

interface ContributionCalendarProps {
  data: CalendarData;
}

const weekDayLabels = ['日', '月', '火', '水', '木', '金', '土'];

export const ContributionCalendar: FC<ContributionCalendarProps> = ({ data }) => {
  const days = getCalendarDays(12);

  // Group days by week
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Get month labels for header
  const getMonthLabels = () => {
    const labels: { month: string; colSpan: number }[] = [];
    let currentMonth = '';
    let colSpan = 0;

    weeks.forEach((week) => {
      const firstDayOfWeek = week[0];
      const month = format(firstDayOfWeek, 'M月');

      if (month !== currentMonth) {
        if (currentMonth) {
          labels.push({ month: currentMonth, colSpan });
        }
        currentMonth = month;
        colSpan = 1;
      } else {
        colSpan++;
      }
    });

    if (currentMonth) {
      labels.push({ month: currentMonth, colSpan });
    }

    return labels;
  };

  const monthLabels = getMonthLabels();

  return (
    <div className="space-y-1">
      {/* Month labels */}
      <div className="flex text-xs text-gray-500">
        <div className="w-8" /> {/* Spacer for weekday labels */}
        {monthLabels.map((label, index) => (
          <div
            key={index}
            style={{ width: `${label.colSpan * 16}px` }}
            className="text-left"
          >
            {label.month}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex gap-1">
        {/* Weekday labels */}
        <div className="flex flex-col gap-1 text-xs text-gray-500 pr-1">
          {weekDayLabels.map((day, index) => (
            <div key={index} className="h-3 flex items-center justify-end w-6">
              {index % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Cells */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day) => {
              const dateStr = formatDate(day);
              const entry = data.entries[dateStr];
              return (
                <CalendarCell
                  key={dateStr}
                  date={day}
                  completedCount={entry?.completedCount || 0}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-gray-500 pt-2">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-contrib-0" />
        <div className="w-3 h-3 rounded-sm bg-contrib-1" />
        <div className="w-3 h-3 rounded-sm bg-contrib-2" />
        <div className="w-3 h-3 rounded-sm bg-contrib-3" />
        <div className="w-3 h-3 rounded-sm bg-contrib-4" />
        <span>More</span>
      </div>
    </div>
  );
};
