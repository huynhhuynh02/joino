'use client';

import { useUIStore } from '@/stores/uiStore';
import { STATUS_CONFIG, PRIORITY_CONFIG, getInitials, cn, formatDate, isOverdue } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Paperclip, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensors,
  useSensor,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

// Draggable Task Card
function SortableTaskCard({ task }: { task: any }) {
  const t = useTranslations();
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityConf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedTaskId(task.id)}
      className="task-card flex flex-col gap-2 shadow-sm rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors"
    >
      <div className="flex gap-2">
        <Badge variant="outline" className={cn('text-[9px] uppercase h-4 px-1.5 border-none', priorityConf?.className)}>
          {t(`priority.${task.priority}`).charAt(0)}
        </Badge>
        <span className="text-xs font-semibold text-foreground/90 leading-tight">
          {task.title}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex gap-2">
          {task.dueDate && (
            <span className={cn('text-[10px]', overdue ? 'text-destructive font-medium' : 'text-muted-foreground/60')}>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {(task._count?.comments > 0 || task._count?.attachments > 0) && (
            <div className="flex gap-1 text-[10px] text-muted-foreground/60 mr-1">
              {task._count.comments > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /></span>}
              {task._count.attachments > 0 && <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" /></span>}
            </div>
          )}
          {task.assignee && (
            <Avatar className="w-5 h-5 border border-card">
              <AvatarImage src={task.assignee.avatar || ''} />
              <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}

// Kanban Column
function BoardColumn({ status, label, dotColor, tasks, projectId }: any) {
  const openCreateTask = useUIStore((s) => s.openCreateTask);
  const taskIds = useMemo(() => tasks.map((t: any) => t.id), [tasks]);

  const { setNodeRef } = useDroppable({
    id: `column-${status}`,
    data: { type: 'Column', status },
  });

  return (
    <div className="kanban-column bg-secondary/30 flex flex-col h-full rounded-xl w-72 flex-shrink-0 mr-4 border border-border">
      <div className="flex items-center justify-between mb-3 px-3 pt-3">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', dotColor)} />
          <h3 className="font-semibold text-sm text-foreground">{label}</h3>
          <Badge variant="secondary" className="text-xs bg-muted/50 text-muted-foreground/60 px-1.5 h-5 border-none">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground/40 hover:text-foreground"
          onClick={() => openCreateTask(projectId, status)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-4 px-2 min-h-[150px] transition-colors"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task: any) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function TaskBoard({ tasks, projectId }: { tasks: any[]; projectId: string }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<any | null>(null);

  // Optimistically rendered state
  const [localTasks, setLocalTasks] = useState(tasks);

  useMemo(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const updateTask = useMutation({
    mutationFn: (data: { id: string; status: string; position: number }) =>
      api.put(`/api/tasks/${data.id}/reorder`, { newStatus: data.status, newPosition: data.position }),
    onSuccess: () => {
      // Background refetch to sync correctly
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const columns = Object.keys(STATUS_CONFIG).map((status) => ({
    status,
    dotColor: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].dotColor,
    label: t(`status.${status}`),
    tasks: localTasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position),
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (e: DragStartEvent) => {
    const { active } = e;
    setActiveTask(active.data.current?.task || null);
  };

  const handleDragOver = (e: any) => {
    // Only handle cross container movements
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find items
    const activeTaskIndex = localTasks.findIndex(t => t.id === activeId);
    if (activeTaskIndex < 0) return;

    // Handle dropping on an empty column or a column generally
    const isOverColumn = String(overId).startsWith('column-');
    if (isOverColumn) {
      const columnStatus = String(overId).replace('column-', '');
      const activeObj = localTasks[activeTaskIndex];
      
      const newTasks = [...localTasks];
      newTasks[activeTaskIndex] = { ...activeObj, status: columnStatus };
      setLocalTasks(newTasks);

      const maxPosition = Math.max(0, ...localTasks.filter(t => t.status === columnStatus).map(t => t.position));
      
      updateTask.mutate({ id: activeObj.id, status: columnStatus, position: maxPosition + 1 });
      return;
    }

    // Handle dropping on a task
    const overTask = localTasks.find(t => t.id === overId);
    
    if (overTask) {
      const activeObj = localTasks[activeTaskIndex];
      const newStatus = overTask.status;
      
      // Update local state optimistic
      const newTasks = [...localTasks];
      newTasks[activeTaskIndex] = { ...activeObj, status: newStatus };
      setLocalTasks(newTasks);

      updateTask.mutate({ id: activeObj.id, status: newStatus, position: overTask.position });
    }
  };

  return (
    <div className="h-full w-full overflow-x-auto p-4 bg-background">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full">
          {columns.map((col) => (
            <BoardColumn
              key={col.status}
              projectId={projectId}
              status={col.status}
              label={col.label}
              dotColor={col.dotColor}
              tasks={col.tasks}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="task-card flex flex-col gap-2 shadow-xl rounded-lg rotate-2 scale-105 opacity-90 cursor-grabbing bg-card w-full border border-primary/40 p-3">
              <span className="text-xs font-semibold text-foreground">{activeTask.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
