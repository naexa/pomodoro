import { useState, useEffect, useCallback } from 'react';
import { Reflection } from '../types';
import { fetchReflections, createReflection, updateReflection } from '../api/dataApi';
import { formatDate } from '../utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import { subDays } from 'date-fns';

export const useReflection = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReflections = useCallback(async () => {
    try {
      const data = await fetchReflections();
      setReflections(data.reflections);
    } catch (error) {
      console.error('Failed to load reflections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReflections();
  }, [loadReflections]);

  const addReflection = useCallback(async (content: string) => {
    const today = formatDate(new Date());
    const yesterday = formatDate(subDays(new Date(), 1));

    const newReflection: Reflection = {
      id: uuidv4(),
      date: today,
      targetDate: yesterday,
      content,
      createdAt: new Date().toISOString(),
    };

    await createReflection(newReflection);
    setReflections((prev) => [...prev, newReflection]);
    return newReflection;
  }, []);

  const getTodayReflection = useCallback((): Reflection | undefined => {
    const today = formatDate(new Date());
    return reflections.find((r) => r.date === today);
  }, [reflections]);

  const needsReflection = useCallback((): boolean => {
    const today = formatDate(new Date());
    const hasToday = reflections.some((r) => r.date === today);
    return !hasToday;
  }, [reflections]);

  const editReflection = useCallback(async (id: string, content: string) => {
    await updateReflection(id, { content });
    setReflections((prev) =>
      prev.map((r) => (r.id === id ? { ...r, content } : r))
    );
  }, []);

  return {
    reflections,
    loading,
    addReflection,
    editReflection,
    getTodayReflection,
    needsReflection,
    reload: loadReflections,
  };
};
