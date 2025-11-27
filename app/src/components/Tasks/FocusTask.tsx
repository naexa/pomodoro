import { FC } from 'react';
import { Task } from '../../types';

interface FocusTaskProps {
  task: Task | undefined;
}

export const FocusTask: FC<FocusTaskProps> = ({ task }) => {
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
      <div className="text-sm text-blue-600 font-semibold mb-1">
        現在のフォーカス
      </div>
      <div className="text-xl font-bold text-blue-800">{task.title}</div>
    </div>
  );
};
