import { FC, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task, Category } from '../../types';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { FocusTask } from './FocusTask';

interface TaskListProps {
  tasks: Task[];
  focusedTask: Task | undefined;
  categories: Category[];
  onAdd: (title: string, categoryId?: string) => void;
  onEdit: (id: string, updates: { title?: string; categoryId?: string | null }) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSetFocus: (id: string) => void;
  onReorder?: (tasks: Task[]) => void;
  onCreateCategory: (name: string) => Promise<Category>;
}

export const TaskList: FC<TaskListProps> = ({
  tasks,
  focusedTask,
  categories,
  onAdd,
  onEdit,
  onToggleComplete,
  onDelete,
  onSetFocus,
  onReorder,
  onCreateCategory,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const pendingTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // 完了タスクを完了日時順でソート（新しい順）
  const completedTasks = tasks
    .filter((t) => t.completed)
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime; // 降順（新しいものが上）
    });

  // 表示する完了タスク（5件まで、または全件）
  const visibleCompletedTasks = showAllCompleted
    ? completedTasks
    : completedTasks.slice(0, 5);
  const hiddenCount = completedTasks.length - 5;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pendingTasks.findIndex((t) => t.id === active.id);
      const newIndex = pendingTasks.findIndex((t) => t.id === over.id);

      const reorderedPending = arrayMove(pendingTasks, oldIndex, newIndex).map(
        (task, index) => ({ ...task, order: index })
      );

      const newTasks = [...reorderedPending, ...completedTasks];
      onReorder?.(newTasks);
    }
  };

  return (
    <div className="space-y-4">
      <FocusTask task={focusedTask} />

      <TaskForm
        onAdd={onAdd}
        categories={categories}
        onCreateCategory={onCreateCategory}
      />

      {pendingTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">
            未完了 ({pendingTasks.length})
            <span className="text-xs text-gray-400 font-normal ml-2">
              ドラッグで並び替え
            </span>
          </h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pendingTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    categories={categories}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSetFocus={onSetFocus}
                    onCreateCategory={onCreateCategory}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">
            完了 ({completedTasks.length})
          </h3>
          {visibleCompletedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              categories={categories}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetFocus={onSetFocus}
              onCreateCategory={onCreateCategory}
            />
          ))}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllCompleted(!showAllCompleted)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {showAllCompleted ? (
                <>
                  <span>▲</span>
                  <span>折りたたむ</span>
                </>
              ) : (
                <>
                  <span>▼</span>
                  <span>さらに {hiddenCount} 件を表示</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {tasks.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          タスクがありません。新しいタスクを追加しましょう！
        </p>
      )}
    </div>
  );
};
