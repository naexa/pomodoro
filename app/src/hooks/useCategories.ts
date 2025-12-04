import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../api/dataApi';
import { v4 as uuidv4 } from 'uuid';

// 利用可能な色のリスト
export const CATEGORY_COLORS = [
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'pink',
  'indigo',
  'teal',
  'orange',
  'cyan',
] as const;

export type CategoryColor = typeof CATEGORY_COLORS[number];

// 色に対応するTailwindクラスを返す
export const getCategoryColorClasses = (color: string): { bg: string; text: string; border: string } => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  };
  return colorMap[color] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data.categories.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = useCallback(async (name: string, color?: string) => {
    // 次の色を自動選択（使われていない色から選ぶ）
    const usedColors = new Set(categories.map(c => c.color));
    const nextColor = color || CATEGORY_COLORS.find(c => !usedColors.has(c)) || CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];

    const newCategory: Category = {
      id: uuidv4(),
      name,
      color: nextColor,
      order: categories.length,
      createdAt: new Date().toISOString(),
    };

    await createCategory(newCategory);
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, [categories]);

  const editCategory = useCallback(async (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>) => {
    await updateCategory(id, updates);
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    await deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCategoryById = useCallback((id: string | undefined) => {
    if (!id) return undefined;
    return categories.find(c => c.id === id);
  }, [categories]);

  const getCategoryByName = useCallback((name: string) => {
    return categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  }, [categories]);

  const searchCategories = useCallback((query: string) => {
    if (!query) return categories;
    const lowerQuery = query.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(lowerQuery));
  }, [categories]);

  return {
    categories,
    loading,
    addCategory,
    editCategory,
    removeCategory,
    getCategoryById,
    getCategoryByName,
    searchCategories,
    reload: loadCategories,
  };
};
