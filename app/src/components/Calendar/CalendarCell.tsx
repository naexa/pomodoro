import { FC } from 'react';
import { format } from 'date-fns';
import { CalendarThresholds } from '../../types';
import { getContributionLevel } from '../../utils/dateUtils';

interface CalendarCellProps {
  date: Date;
  pomodoroCount: number;
  completedCount: number;
  onClick?: () => void;
  thresholds?: CalendarThresholds;
}

const LEVEL_COLORS = [
  '#ebedf0', // Level 0
  '#9be9a8', // Level 1
  '#40c463', // Level 2
  '#30a14e', // Level 3
  '#216e39', // Level 4
];

export const CalendarCell: FC<CalendarCellProps> = ({ date, pomodoroCount, completedCount, onClick, thresholds }) => {
  const level = getContributionLevel(pomodoroCount, thresholds);
  const dateStr = format(date, 'yyyy-MM-dd');
  const displayDate = format(date, 'MMM d, yyyy');

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.open(`/log?date=${dateStr}`, '_blank');
    }
  };

  const tooltipText = `${displayDate}: ${pomodoroCount} pomodoros, ${completedCount} tasks completed`;

  return (
    <div
      onClick={handleClick}
      style={{
        width: '10px',
        height: '10px',
        borderRadius: '2px',
        backgroundColor: LEVEL_COLORS[level],
        cursor: 'pointer',
        outline: 'none',
      }}
      className="hover:ring-1 hover:ring-gray-400"
      title={tooltipText}
      data-date={dateStr}
    />
  );
};
