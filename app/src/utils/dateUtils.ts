import { format, subDays, startOfWeek, addDays } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getCalendarDays = (weeks: number = 12): Date[] => {
  const today = new Date();
  const start = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 0 });
  const days: Date[] = [];

  for (let i = 0; i < weeks * 7 + 7; i++) {
    days.push(addDays(start, i));
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
