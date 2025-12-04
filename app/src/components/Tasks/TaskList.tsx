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

  const INITIAL_DISPLAY = 5;
  const MAX_DISPLAY = 20;
  const [isExpanded, setIsExpanded] = useState(false);

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

  // 表示する完了タスク（デフォルト5件、展開時は最大20件）
  const displayLimit = isExpanded ? MAX_DISPLAY : INITIAL_DISPLAY;
  const visibleCompletedTasks = completedTasks.slice(0, displayLimit);
  const canExpand = !isExpanded && completedTasks.length > INITIAL_DISPLAY;
  const expandCount = Math.min(completedTasks.length, MAX_DISPLAY) - INITIAL_DISPLAY;
  const hasMoreThanMax = completedTasks.length > MAX_DISPLAY;

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
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider pl-1">
            未完了 ({pendingTasks.length})
            <span className="text-xs font-normal ml-2 opacity-60">
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
              <div className="space-y-3">
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
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider pl-1">
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
          {canExpand && (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span>▼</span>
              <span>さらに {expandCount} 件を表示</span>
            </button>
          )}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span>▲</span>
              <span>折りたたむ</span>
            </button>
          )}
          {isExpanded && hasMoreThanMax && (
            <a
              href="#/history"
              className="w-full py-2 text-sm text-primary hover:text-primary-hover hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span>履歴を見る（全{completedTasks.length}件）</span>
              <span>→</span>
            </a>
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
