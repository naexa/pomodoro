import { FC, useState } from 'react';
import { Task } from '../../types';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onSetFocus: (id: string) => void;
}

export const TaskItem: FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onSetFocus,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleSave = () => {
    if (editTitle.trim()) {
      onEdit(task.id, editTitle.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        task.isFocused
          ? 'border-blue-500 bg-blue-50'
          : task.completed
          ? 'border-gray-200 bg-gray-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task.id)}
        className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
      />

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <span
          className={`flex-1 ${
            task.completed ? 'line-through text-gray-400' : 'text-gray-800'
          }`}
        >
          {task.title}
        </span>
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
