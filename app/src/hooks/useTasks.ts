import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { fetchTasks, createTask, updateTask, deleteTask } from '../api/dataApi';
import { v4 as uuidv4 } from 'uuid';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (title: string) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      completed: false,
      isFocused: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    await createTask(newTask);
    setTasks((prev) => [...prev, newTask]);
    return newTask;
  }, []);

  const editTask = useCallback(async (id: string, title: string) => {
    await updateTask(id, { title });
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
    );
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updates = {
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
    };
    await updateTask(id, updates);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, [tasks]);

  const removeTask = useCallback(async (id: string) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setFocusTask = useCallback(async (id: string) => {
    // Clear all focus first, then set the new one
    const updates = tasks.map(async (t) => {
      if (t.isFocused && t.id !== id) {
        await updateTask(t.id, { isFocused: false });
      }
    });
    await Promise.all(updates);

    const task = tasks.find((t) => t.id === id);
    if (task) {
      await updateTask(id, { isFocused: !task.isFocused });
    }

    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        isFocused: t.id === id ? !t.isFocused : false,
      }))
    );
  }, [tasks]);

  const reorderTasks = useCallback(async (reorderedTasks: Task[]) => {
    setTasks(reorderedTasks);
    // 各タスクのorderを更新
    for (const task of reorderedTasks) {
      if (task.order !== undefined) {
        await updateTask(task.id, { order: task.order });
      }
    }
  }, []);

  const focusedTask = tasks.find((t) => t.isFocused);
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;

  return {
    tasks,
    loading,
    focusedTask,
    completedCount,
    pendingCount,
    addTask,
    editTask,
    toggleComplete,
    removeTask,
    setFocusTask,
    reorderTasks,
    reload: loadTasks,
  };
};
