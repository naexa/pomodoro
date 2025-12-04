import { FC, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import { Task, Category } from '../../types';
import { CategoryBadge } from '../Category';
import { getCategoryColorClasses } from '../../hooks/useCategories';

interface SortableTaskItemProps {
  task: Task;
  categories: Category[];
  onToggleComplete: (id: string) => void;
  onEdit: (id: string, updates: { title?: string; categoryId?: string | null }) => void;
  onDelete: (id: string) => void;
  onSetFocus: (id: string) => void;
  onCreateCategory?: (name: string) => Promise<Category>;
}

export const SortableTaskItem: FC<SortableTaskItemProps> = ({
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  const handleCategoryChange = (categoryId: string | null) => {
    onEdit(task.id, { categoryId });
    setShowCategoryPicker(false);
  };

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
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 p-4 rounded-xl border ${isDragging ? 'z-50 shadow-xl bg-white rotate-1 scale-105' : 'transition-all duration-200'
        } ${isCompleting
          ? 'opacity-0 translate-x-8'
          : 'opacity-100 translate-x-0'
        } ${task.isFocused
          ? 'border-primary/30 bg-primary/5 shadow-md shadow-primary/10'
          : task.completed
            ? 'border-transparent bg-gray-50/50'
            : 'border-transparent bg-white shadow-sm hover:shadow-md hover:border-gray-100'
        } ${isEditing ? 'ring-2 ring-primary/20' : ''} ${isEditing || showCategoryPicker ? 'relative z-20' : ''
        }`}
    >
      {/* ドラッグハンドル */}
      {!task.completed && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-text-muted/50 hover:text-primary transition-colors touch-none p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
      )}

      <input
        ref={checkboxRef}
        type="checkbox"
        checked={task.completed || isCompleting}
        onChange={handleToggleComplete}
        className="w-6 h-6 rounded-full border-gray-300 text-primary focus:ring-primary/50 transition-all cursor-pointer"
      />

      {isEditing ? (
        <div className="flex-1 relative z-50">
          <div className="flex items-center gap-2 px-3 py-2 border border-primary/30 rounded-lg focus-within:ring-2 focus-within:ring-primary/20 bg-white shadow-sm">
            <input
              ref={editInputRef}
              type="text"
              value={editTitle}
              onChange={handleEditInputChange}
              onBlur={() => {
                if (!showEditSuggestions) {
                  handleSave();
                }
              }}
              onKeyDown={handleEditKeyDown}
              placeholder="#でカテゴリ設定"
              className="flex-1 focus:outline-none min-w-0 text-text-main placeholder:text-text-muted"
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
              className="absolute z-[100] mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-auto p-1"
            >
              {filteredCategories.map((cat, index) => {
                const colors = getCategoryColorClasses(cat.color);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectEditCategory(cat)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 rounded-lg transition-colors ${index === editSuggestionIndex ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`} />
                    <span className="text-sm text-text-main">{cat.name}</span>
                  </button>
                );
              })}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={() => selectEditCategory(null, true)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 rounded-lg transition-colors text-primary ${editSuggestionIndex === filteredCategories.length ? 'bg-primary/5' : 'hover:bg-primary/5'
                    }`}
                >
                  <span className="text-lg">+</span>
                  <span className="text-sm">「{hashtagQuery}」を作成</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span
            className={`truncate text-base font-medium transition-colors ${task.completed ? 'line-through text-text-muted' : 'text-text-main'
              }`}
          >
            {task.title}
          </span>
          {task.completed && task.completedAt && (
            <span className="text-xs text-text-muted whitespace-nowrap">
              完了: {new Date(task.completedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
            </span>
          )}
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
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-text-muted hover:text-primary px-2 py-1 rounded-full hover:bg-primary/5"
                title="カテゴリを設定"
              >
                + Category
              </button>
            )}
            {showCategoryPicker && (
              <div className="absolute z-20 top-full left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl min-w-[160px] p-1">
                {categories.map(cat => {
                  const colors = getCategoryColorClasses(cat.color);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 rounded-lg transition-colors ${cat.id === task.categoryId ? 'bg-gray-50' : 'hover:bg-gray-50'
                        }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.bg} ${colors.border} border`} />
                      <span className="text-text-main">{cat.name}</span>
                    </button>
                  );
                })}
                {category && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(null)}
                      className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

      <div className={`flex gap-1 transition-opacity duration-200 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {!task.completed && (
          <button
            onClick={() => onSetFocus(task.id)}
            className={`p-2 rounded-lg transition-colors ${task.isFocused
              ? 'bg-primary text-white shadow-glow'
              : 'text-text-muted hover:bg-primary/10 hover:text-primary'
              }`}
            title={task.isFocused ? 'フォーカス解除' : 'フォーカス'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={task.isFocused ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )}
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-text-muted hover:bg-gray-100 hover:text-text-main rounded-lg transition-colors"
          title="編集"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 text-text-muted hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
          title="削除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
};
