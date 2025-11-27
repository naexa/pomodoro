import { FC } from 'react';
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
import { Task } from '../../types';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { FocusTask } from './FocusTask';

interface TaskListProps {
  tasks: Task[];
  focusedTask: Task | undefined;
  onAdd: (title: string) => void;
  onEdit: (id: string, title: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSetFocus: (id: string) => void;
  onReorder?: (tasks: Task[]) => void;
}

export const TaskList: FC<TaskListProps> = ({
  tasks,
  focusedTask,
  onAdd,
  onEdit,
  onToggleComplete,
  onDelete,
  onSetFocus,
  onReorder,
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

  const pendingTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const completedTasks = tasks.filter((t) => t.completed);

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

      <TaskForm onAdd={onAdd} />

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
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSetFocus={onSetFocus}
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
          {completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetFocus={onSetFocus}
            />
          ))}
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
