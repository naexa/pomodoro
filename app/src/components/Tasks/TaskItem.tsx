import { FC, useState, useRef, useEffect, KeyboardEvent } from 'react';
import confetti from 'canvas-confetti';
import { Task, Category } from '../../types';
import { CategoryBadge } from '../Category';
import { getCategoryColorClasses } from '../../hooks/useCategories';

interface TaskItemProps {
  task: Task;
  categories: Category[];
  onToggleComplete: (id: string) => void;
  onEdit: (id: string, updates: { title?: string; categoryId?: string | null }) => void;
  onDelete: (id: string) => void;
  onSetFocus: (id: string) => void;
  onCreateCategory?: (name: string) => Promise<Category>;
}

export const TaskItem: FC<TaskItemProps> = ({
  task,
  categories,
  onToggleComplete,
  onEdit,
  onDelete,
  onSetFocus,
  onCreateCategory,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCategoryId, setEditCategoryId] = useState<string | undefined>(task.categoryId);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // ハッシュタグ入力用の状態
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [editSuggestionIndex, setEditSuggestionIndex] = useState(0);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [hashtagStartPos, setHashtagStartPos] = useState<number | null>(null);

  const checkboxRef = useRef<HTMLInputElement>(null);
  const categoryPickerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const editSuggestionsRef = useRef<HTMLDivElement>(null);

  const category = categories.find(c => c.id === task.categoryId);
  const editCategory = categories.find(c => c.id === editCategoryId);

  // ハッシュタグクエリに基づいてフィルタリング
  const filteredCategories = hashtagQuery
    ? categories.filter(c => c.name.toLowerCase().includes(hashtagQuery.toLowerCase()))
    : categories;

  // 新規作成オプションを表示するかどうか
  const showCreateOption = hashtagQuery && onCreateCategory && !categories.some(
    c => c.name.toLowerCase() === hashtagQuery.toLowerCase()
  );

  const handleSave = () => {
    if (editTitle.trim()) {
      onEdit(task.id, { title: editTitle.trim(), categoryId: editCategoryId ?? null });
      setIsEditing(false);
      resetEditState();
    }
  };

  const resetEditState = () => {
    setShowEditSuggestions(false);
    setHashtagQuery('');
    setHashtagStartPos(null);
    setEditSuggestionIndex(0);
  };

  const handleCategoryChange = (categoryId: string | null) => {
    onEdit(task.id, { categoryId });
    setShowCategoryPicker(false);
  };

  // 編集入力変更時の処理
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setEditTitle(value);

    // # の位置を探す
    const beforeCursor = value.substring(0, cursorPos);
    const hashIndex = beforeCursor.lastIndexOf('#');

    if (hashIndex !== -1) {
      const afterHash = value.substring(hashIndex + 1);
      const spaceIndex = afterHash.indexOf(' ');
      const query = spaceIndex === -1 ? afterHash : afterHash.substring(0, spaceIndex);

      if (cursorPos > hashIndex && (spaceIndex === -1 || cursorPos <= hashIndex + 1 + spaceIndex)) {
        setHashtagQuery(query);
        setHashtagStartPos(hashIndex);
        setShowEditSuggestions(true);
        setEditSuggestionIndex(0);
      } else {
        resetEditState();
      }
    } else {
      resetEditState();
    }
  };

  // カテゴリ選択時の処理
  const selectEditCategory = async (cat: Category | null, isNew = false) => {
    let newCat = cat;
    if (isNew && hashtagQuery && onCreateCategory) {
      newCat = await onCreateCategory(hashtagQuery);
    }

    if (newCat) {
      setEditCategoryId(newCat.id);
    }

    // 入力欄から #query 部分を削除
    if (hashtagStartPos !== null) {
      const beforeHash = editTitle.substring(0, hashtagStartPos);
      const afterQuery = editTitle.substring(hashtagStartPos + 1 + hashtagQuery.length);
      setEditTitle((beforeHash + afterQuery).trim());
    }

    resetEditState();
    editInputRef.current?.focus();
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showEditSuggestions) {
      const totalItems = filteredCategories.length + (showCreateOption ? 1 : 0);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setEditSuggestionIndex(prev => (prev + 1) % totalItems);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setEditSuggestionIndex(prev => (prev - 1 + totalItems) % totalItems);
          return;
        case 'Enter':
          if (totalItems > 0) {
            e.preventDefault();
            if (editSuggestionIndex < filteredCategories.length) {
              selectEditCategory(filteredCategories[editSuggestionIndex]);
            } else if (showCreateOption) {
              selectEditCategory(null, true);
            }
            return;
          }
          break;
        case 'Escape':
          e.preventDefault();
          resetEditState();
          return;
      }
    }

    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setEditCategoryId(task.categoryId);
      setIsEditing(false);
      resetEditState();
    }
  };

  // クリック外でサジェストを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        editSuggestionsRef.current &&
        !editSuggestionsRef.current.contains(e.target as Node) &&
        editInputRef.current &&
        !editInputRef.current.contains(e.target as Node)
      ) {
        resetEditState();
      }
    };

    if (showEditSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEditSuggestions]);

  const handleToggleComplete = () => {
    if (!task.completed) {
      // 未完了→完了の場合、アニメーション発火
      setIsCompleting(true);

      // チェックボックスの位置から紙吹雪を発射
      if (checkboxRef.current) {
        const rect = checkboxRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        // 控えめな紙吹雪
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { x, y },
          colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
          ticks: 100,
          gravity: 1.2,
          scalar: 0.8,
          disableForReducedMotion: true,
        });
      }

      // アニメーション後に実際の完了処理
      setTimeout(() => {
        onToggleComplete(task.id);
        setIsCompleting(false);
      }, 400);
    } else {
      // 完了→未完了は即座に実行
      onToggleComplete(task.id);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
        isCompleting
          ? 'opacity-0 translate-x-8 scale-95'
          : 'opacity-100 translate-x-0 scale-100'
      } ${
        task.isFocused
          ? 'border-blue-500 bg-blue-50'
          : task.completed
          ? 'border-gray-200 bg-gray-50'
          : 'border-gray-200 bg-white'
      } ${isEditing ? 'relative z-50' : ''}`}
    >
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={task.completed || isCompleting}
        onChange={handleToggleComplete}
        className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500 transition-colors"
      />

      {isEditing ? (
        <div className="flex-1 relative z-50">
          <div className="flex items-center gap-2 px-2 py-1 border rounded focus-within:ring-2 focus-within:ring-blue-500 bg-white">
            <input
              ref={editInputRef}
              type="text"
              value={editTitle}
              onChange={handleEditInputChange}
              onBlur={() => {
                // サジェスト表示中はblurで保存しない
                if (!showEditSuggestions) {
                  handleSave();
                }
              }}
              onKeyDown={handleEditKeyDown}
              placeholder="#でカテゴリ設定"
              className="flex-1 focus:outline-none min-w-0"
              autoFocus
            />
            {editCategory && (
              <CategoryBadge
                category={editCategory}
                size="sm"
                onRemove={() => setEditCategoryId(undefined)}
              />
            )}
          </div>

          {/* 編集時のカテゴリサジェスト */}
          {showEditSuggestions && (filteredCategories.length > 0 || showCreateOption) && (
            <div
              ref={editSuggestionsRef}
              className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto"
            >
              {filteredCategories.map((cat, index) => {
                const colors = getCategoryColorClasses(cat.color);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectEditCategory(cat)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 ${
                      index === editSuggestionIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={() => selectEditCategory(null, true)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-blue-600 ${
                    editSuggestionIndex === filteredCategories.length ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="text-lg">+</span>
                  <span>「{hashtagQuery}」を作成</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span
            className={`truncate ${
              task.completed ? 'line-through text-gray-400' : 'text-gray-800'
            }`}
          >
            {task.title}
          </span>
          {/* カテゴリバッジ / ピッカー */}
          <div className="relative flex-shrink-0" ref={categoryPickerRef}>
            {category ? (
              <CategoryBadge
                category={category}
                size="sm"
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                className="text-xs text-gray-400 hover:text-gray-600 px-1"
                title="カテゴリを設定"
              >
                +#
              </button>
            )}
            {showCategoryPicker && (
              <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-32 py-1">
                {categories.map(cat => {
                  const colors = getCategoryColorClasses(cat.color);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                        cat.id === task.categoryId ? 'bg-gray-100' : ''
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.bg} ${colors.border} border`} />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
                {category && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(null)}
                      className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50"
                    >
                      カテゴリを解除
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!task.completed && (
          <button
            onClick={() => onSetFocus(task.id)}
            className={`px-2 py-1 text-sm rounded ${
              task.isFocused
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={task.isFocused ? 'フォーカス解除' : 'フォーカス'}
          >
            {task.isFocused ? '★' : '☆'}
          </button>
        )}
        <button
          onClick={() => setIsEditing(true)}
          className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
        >
          編集
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="px-2 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
        >
          削除
        </button>
      </div>
    </div>
  );
};
