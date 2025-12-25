/**
 * Store Tasks Kanban Component
 * Date: 2 Février 2025
 * 
 * Vue Kanban pour les tâches (drag & drop)
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { useStoreTasks, type StoreTask, type TaskFilters } from '@/hooks/useStoreTasks';
import { useStoreTaskUpdate } from '@/hooks/useStoreTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus } from 'lucide-react';
import { StoreTaskCreateDialog } from './StoreTaskCreateDialog';
import { StoreTaskCard } from './StoreTaskCard';
import { StoreTaskDetailDialog } from './StoreTaskDetailDialog';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StoreTasksKanbanProps {
  storeId: string;
  filters?: TaskFilters;
}

const STATUS_COLUMNS: Array<{
  id: StoreTask['status'];
  label: string;
  color: string;
}> = [
  {
    id: 'pending',
    label: 'En attente',
    color: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    id: 'in_progress',
    label: 'En cours',
    color: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'review',
    label: 'En révision',
    color: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'completed',
    label: 'Terminées',
    color: 'bg-green-500/10 border-green-500/20',
  },
];

interface SortableTaskProps {
  task: StoreTask;
  onTaskClick: (task: StoreTask) => void;
}

const SortableTask = memo(({ task, onTaskClick }: SortableTaskProps) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick(task)}
      className="cursor-grab active:cursor-grabbing"
    >
      <StoreTaskCard task={task} />
    </div>
  );
});

interface KanbanColumnProps {
  status: StoreTask['status'];
  label: string;
  color: string;
  tasks: StoreTask[];
  onTaskClick: (task: StoreTask) => void;
}

const KanbanColumn = memo(({ status, label, color, tasks, onTaskClick }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[260px] sm:min-w-[280px]">
      <Card className={cn('h-full', color)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{label}</span>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[calc(100vh-250px)] sm:max-h-[calc(100vh-300px)] overflow-y-auto">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTask key={task.id} task={task} onTaskClick={onTaskClick} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucune tâche
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export const StoreTasksKanban = ({ storeId, filters }: StoreTasksKanbanProps) => {
  const { data: tasks, isLoading } = useStoreTasks(storeId, filters);
  const updateTask = useStoreTaskUpdate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<StoreTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<StoreTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Organiser les tâches par statut
  const tasksByStatus = useMemo(() => {
    if (!tasks) {
      return {
        pending: [],
        in_progress: [],
        review: [],
        completed: [],
        cancelled: [],
        on_hold: [],
      } as Record<StoreTask['status'], StoreTask[]>;
    }
    
    const grouped: Record<StoreTask['status'], StoreTask[]> = {
      pending: [],
      in_progress: [],
      review: [],
      completed: [],
      cancelled: [],
      on_hold: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks?.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newStatus = over.id as StoreTask['status'];

    const task = tasks?.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      await updateTask.mutateAsync({
        storeId,
        taskId,
        updateData: { status: newStatus },
      });
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }, [tasks, storeId, updateTask]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96 w-64" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            <h2 className="text-base sm:text-lg font-semibold">Vue Kanban</h2>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="w-full sm:w-auto"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une tâche
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {STATUS_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                status={column.id}
                label={column.label}
                color={column.color}
                tasks={tasksByStatus[column.id] ?? []}
                onTaskClick={setSelectedTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-50">
                <StoreTaskCard task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <StoreTaskCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      {selectedTask && (
        <StoreTaskDetailDialog
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask.id}
        />
      )}
    </>
  );
};

