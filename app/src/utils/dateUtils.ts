import { format, subDays, startOfWeek, addDays, subWeeks } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getCalendarDays = (weeks: number = 52): Date[] => {
  const today = new Date();
  // 今週の終わり（土曜日）を基準に、指定週数分遡る
  const endOfCurrentWeek = addDays(startOfWeek(today, { weekStartsOn: 0 }), 6);
  const start = startOfWeek(subWeeks(endOfCurrentWeek, weeks - 1), { weekStartsOn: 0 });
  const days: Date[] = [];

  // 今日までの日付を生成
  let current = start;
  while (current <= today) {
    days.push(current);
    current = addDays(current, 1);
  }

  return days;
};

export const getContributionLevel = (count: number): number => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
};
