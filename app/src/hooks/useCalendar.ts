import { useState, useEffect, useCallback } from 'react';
import { CalendarData, CalendarEntry } from '../types';
import { fetchCalendar, updateCalendarEntry } from '../api/dataApi';
import { formatDate } from '../utils/dateUtils';

export const useCalendar = () => {
  const [data, setData] = useState<CalendarData>({ entries: {} });
  const [loading, setLoading] = useState(true);

  const loadCalendar = useCallback(async () => {
    try {
      const calendarData = await fetchCalendar();
      setData(calendarData);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const getEntry = useCallback(
    (date: string): CalendarEntry | undefined => {
      return data.entries[date];
    },
    [data.entries]
  );

  const incrementCompleted = useCallback(
    async (taskId: string) => {
      const today = formatDate(new Date());
      const existing = data.entries[today] || {
        completedCount: 0,
        pomodoroCount: 0,
        tasks: [],
      };

      const newEntry: CalendarEntry = {
        ...existing,
        completedCount: existing.completedCount + 1,
        tasks: existing.tasks.includes(taskId)
          ? existing.tasks
          : [...existing.tasks, taskId],
      };

      await updateCalendarEntry(today, newEntry);
      setData((prev) => ({
        ...prev,
        entries: { ...prev.entries, [today]: newEntry },
      }));
    },
    [data.entries]
  );

  const incrementPomodoro = useCallback(async () => {
    const today = formatDate(new Date());
    const existing = data.entries[today] || {
      completedCount: 0,
      pomodoroCount: 0,
      tasks: [],
    };

    const newEntry: CalendarEntry = {
      ...existing,
      pomodoroCount: existing.pomodoroCount + 1,
    };

    await updateCalendarEntry(today, newEntry);
    setData((prev) => ({
      ...prev,
      entries: { ...prev.entries, [today]: newEntry },
    }));
  }, [data.entries]);

  return {
    data,
    loading,
    getEntry,
    incrementCompleted,
    incrementPomodoro,
    reload: loadCalendar,
  };
};
