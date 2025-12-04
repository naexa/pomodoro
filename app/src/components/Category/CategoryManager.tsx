import { FC, useState } from 'react';
import { Category } from '../../types';
import { getCategoryColorClasses, CATEGORY_COLORS } from '../../hooks/useCategories';

interface CategoryManagerProps {
  categories: Category[];
  onEdit: (id: string, updates: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const CategoryManager: FC<CategoryManagerProps> = ({
  categories,
  onEdit,
  onDelete,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const handleSaveEdit = async () => {
    if (editingId && editName.trim()) {
      await onEdit(editingId, { name: editName.trim(), color: editColor });
      setEditingId(null);
      setEditName('');
      setEditColor('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await onDelete(id);
    setDeleting(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">カテゴリ管理</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              カテゴリがありません。<br />
              タスク入力時に #カテゴリ名 で作成できます。
            </p>
          ) : (
            <ul className="space-y-2">
              {categories.map((category) => {
                const colors = getCategoryColorClasses(category.color);
                const isEditing = editingId === category.id;
                const isDeleting = deleting === category.id;

                return (
                  <li
                    key={category.id}
                    className={`p-3 rounded-lg border ${
                      isEditing ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        {/* Name input */}
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="カテゴリ名"
                          autoFocus
                        />

                        {/* Color picker */}
                        <div className="flex flex-wrap gap-2">
                          {CATEGORY_COLORS.map((color) => {
                            const colorClasses = getCategoryColorClasses(color);
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setEditColor(color)}
                                className={`w-6 h-6 rounded-full border-2 ${colorClasses.bg} ${
                                  editColor === color
                                    ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400'
                                    : 'border-transparent'
                                }`}
                                title={color}
                              />
                            );
                          })}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full ${colors.bg} ${colors.border} border`}
                          />
                          <span className="font-medium text-gray-800">
                            {category.name}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartEdit(category)}
                            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={isDeleting}
                            className="px-2 py-1 text-sm text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                          >
                            {isDeleting ? '削除中...' : '削除'}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            ※ カテゴリを削除すると、そのカテゴリが設定されたタスクからカテゴリが解除されます
          </p>
        </div>
      </div>
    </div>
  );
};
