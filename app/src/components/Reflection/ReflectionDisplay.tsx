import { FC, useState } from 'react';
import { Reflection } from '../../types';

interface ReflectionDisplayProps {
  reflection: Reflection | undefined;
  onEdit?: (id: string, content: string) => Promise<void>;
}

export const ReflectionDisplay: FC<ReflectionDisplayProps> = ({ reflection, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  if (!reflection) {
    return null;
  }

  const handleEditStart = () => {
    setEditContent(reflection.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (onEdit && editContent.trim()) {
      await onEdit(reflection.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <span className="text-xl">💡</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-yellow-700 font-semibold">
              今日の意識ポイント
            </div>
            {!isEditing && onEdit && (
              <button
                onClick={handleEditStart}
                className="text-xs text-yellow-600 hover:text-yellow-800"
              >
                編集
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-yellow-300 rounded text-yellow-800 bg-white resize-none"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editContent.trim()}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            <p className="text-yellow-800">{reflection.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};
