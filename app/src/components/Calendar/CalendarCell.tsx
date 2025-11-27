import { FC } from 'react';
import { format } from 'date-fns';
import { getContributionLevel } from '../../utils/dateUtils';

interface CalendarCellProps {
  date: Date;
  completedCount: number;
}

const levelColors = [
  'bg-contrib-0',
  'bg-contrib-1',
  'bg-contrib-2',
  'bg-contrib-3',
  'bg-contrib-4',
];

export const CalendarCell: FC<CalendarCellProps> = ({ date, completedCount }) => {
  const level = getContributionLevel(completedCount);
  const dateStr = format(date, 'yyyy-MM-dd');
  const displayDate = format(date, 'M/d');

  const handleClick = () => {
    window.open(`/log?date=${dateStr}`, '_blank');
  };

  return (
    <div
      onClick={handleClick}
      className={`w-3 h-3 rounded-sm ${levelColors[level]} cursor-pointer hover:ring-1 hover:ring-gray-400`}
      title={`${displayDate}: ${completedCount}件完了 (クリックで詳細)`}
      data-date={dateStr}
    />
  );
};
