import { FC } from 'react';
import { Task } from '../../types';

interface FocusTaskProps {
  task: Task | undefined;
  onComplete?: (id: string) => void;
}

export const FocusTask: FC<FocusTaskProps> = ({ task, onComplete }) => {
  if (!task) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-center">
          タスクを選択して「★」をクリックするとフォーカスできます
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-blue-600 font-semibold mb-1">
            現在のフォーカス
          </div>
          <div className="text-xl font-bold text-blue-800">{task.title}</div>
        </div>
        {onComplete && (
          <button
            onClick={() => onComplete(task.id)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <span>✓</span>
            <span>完了</span>
          </button>
        )}
      </div>
    </div>
  );
};
