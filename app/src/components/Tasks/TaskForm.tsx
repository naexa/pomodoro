import { FC, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Category } from '../../types';
import { CategoryBadge } from '../Category';
import { getCategoryColorClasses } from '../../hooks/useCategories';

interface TaskFormProps {
  onAdd: (title: string, categoryId?: string) => void;
  categories: Category[];
  onCreateCategory: (name: string) => Promise<Category>;
}

export const TaskForm: FC<TaskFormProps> = ({ onAdd, categories, onCreateCategory }) => {
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [hashtagStartPos, setHashtagStartPos] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ハッシュタグクエリに基づいてフィルタリング
  const filteredCategories = hashtagQuery
    ? categories.filter(c => c.name.toLowerCase().includes(hashtagQuery.toLowerCase()))
    : categories;

  // 新規作成オプションを表示するかどうか
  const showCreateOption = hashtagQuery && !categories.some(
    c => c.name.toLowerCase() === hashtagQuery.toLowerCase()
  );

  // 入力変更時の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setTitle(value);

    // # の位置を探す
    const beforeCursor = value.substring(0, cursorPos);
    const hashIndex = beforeCursor.lastIndexOf('#');

    if (hashIndex !== -1) {
      // # の後ろの文字を取得（スペースがあれば終了）
      const afterHash = value.substring(hashIndex + 1);
      const spaceIndex = afterHash.indexOf(' ');
      const query = spaceIndex === -1 ? afterHash : afterHash.substring(0, spaceIndex);

      // カーソルが # より後ろにある場合のみサジェスト表示
      if (cursorPos > hashIndex && (spaceIndex === -1 || cursorPos <= hashIndex + 1 + spaceIndex)) {
        setHashtagQuery(query);
        setHashtagStartPos(hashIndex);
        setShowSuggestions(true);
        setSuggestionIndex(0);
      } else {
        setShowSuggestions(false);
        setHashtagQuery('');
        setHashtagStartPos(null);
      }
    } else {
      setShowSuggestions(false);
      setHashtagQuery('');
      setHashtagStartPos(null);
    }
  };

  // カテゴリ選択時の処理
  const selectCategory = async (category: Category | null, isNew = false) => {
    if (isNew && hashtagQuery) {
      // 新規カテゴリ作成
      const newCategory = await onCreateCategory(hashtagQuery);
      setSelectedCategory(newCategory);
      category = newCategory;
    } else {
      setSelectedCategory(category);
    }

    // 入力欄から #query 部分を削除
    if (hashtagStartPos !== null) {
      const beforeHash = title.substring(0, hashtagStartPos);
      const afterQuery = title.substring(hashtagStartPos + 1 + hashtagQuery.length);
      setTitle((beforeHash + afterQuery).trim());
    }

    setShowSuggestions(false);
    setHashtagQuery('');
    setHashtagStartPos(null);
    inputRef.current?.focus();
  };

  // キーボード操作
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    const totalItems = filteredCategories.length + (showCreateOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        if (totalItems > 0) {
          e.preventDefault();
          if (suggestionIndex < filteredCategories.length) {
            selectCategory(filteredCategories[suggestionIndex]);
          } else if (showCreateOption) {
            selectCategory(null, true);
          }
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), selectedCategory?.id);
      setTitle('');
      setSelectedCategory(null);
    }
  };

  // クリック外でサジェストを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="新しいタスクを入力... #でカテゴリ設定"
              className="flex-1 focus:outline-none min-w-0"
            />
            {selectedCategory && (
              <CategoryBadge
                category={selectedCategory}
                size="sm"
                onRemove={() => setSelectedCategory(null)}
              />
            )}
          </div>

          {/* サジェストドロップダウン */}
          {showSuggestions && (filteredCategories.length > 0 || showCreateOption) && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto"
            >
              {filteredCategories.map((category, index) => {
                const colors = getCategoryColorClasses(category.color);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 ${
                      index === suggestionIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`} />
                    <span>{category.name}</span>
                  </button>
                );
              })}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={() => selectCategory(null, true)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-blue-600 ${
                    suggestionIndex === filteredCategories.length ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="text-lg">+</span>
                  <span>「{hashtagQuery}」を作成</span>
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap"
        >
          追加
        </button>
      </div>

      {/* クイックカテゴリ選択 */}
      {categories.length > 0 && !selectedCategory && (
        <div className="flex flex-wrap gap-1">
          {categories.slice(0, 6).map(category => {
            const colors = getCategoryColorClasses(category.color);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`text-xs px-2 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 transition-opacity`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      )}
    </form>
  );
};
