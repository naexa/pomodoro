import { format, startOfWeek, addDays, subWeeks } from 'date-fns';
import { CalendarThresholds } from '../types';

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

// デフォルトのしきい値
export const DEFAULT_CALENDAR_THRESHOLDS: CalendarThresholds = {
  level1: 1,
  level2: 2,
  level3: 3,
  level4: 5,
};

export const getContributionLevel = (
  count: number,
  thresholds: CalendarThresholds = DEFAULT_CALENDAR_THRESHOLDS
): number => {
  if (count === 0) return 0;
  if (count >= thresholds.level4) return 4;
  if (count >= thresholds.level3) return 3;
  if (count >= thresholds.level2) return 2;
  if (count >= thresholds.level1) return 1;
  return 0;
};

// 指定年の1月1日から12月31日までの日付を取得
export const getYearCalendarDays = (year: number): Date[] => {
  const start = new Date(year, 0, 1); // 1月1日
  const end = new Date(year, 11, 31); // 12月31日
  const today = new Date();

  // 週の開始日（日曜日）に調整
  const adjustedStart = startOfWeek(start, { weekStartsOn: 0 });

  const days: Date[] = [];
  let current = adjustedStart;

  // 年末または今日まで
  const limitDate = year === today.getFullYear() ? today : end;

  while (current <= limitDate) {
    days.push(current);
    current = addDays(current, 1);
  }

  return days;
};
