'use client';

import { useState, useMemo } from 'react';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { useUIStore } from '@/stores/uiStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

export function TaskGantt({ tasks, projectId, color }: { tasks: any[]; projectId: string; color: string }) {
  const t = useTranslations();
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);

  const updateTask = useMutation({
    mutationFn: (data: { id: string; startDate: string; dueDate: string }) =>
      api.put(`/api/tasks/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const ganttTasks: GanttTask[] = useMemo(() => {
    // Need at least one valid task or the Gantt lib crashes
    const validTasks = tasks.map((t) => {
      // Default to today and tomorrow if missing dates
      const start = t.startDate ? new Date(t.startDate) : new Date();
      const end = t.dueDate ? new Date(t.dueDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
      
      // Ensure start is before end
      if (start > end) {
        end.setTime(start.getTime() + 24 * 60 * 60 * 1000);
      }

      return {
        id: t.id,
        name: t.title,
        start,
        end,
        type: 'task' as const,
        progress: t.status === 'DONE' ? 100 : t.status === 'IN_PROGRESS' ? 50 : 0,
        isDisabled: false,
        styles: {
          backgroundColor: color,
          progressColor: color,
          progressSelectedColor: color,
        },
      };
    });

    // Provide a dummy if empty
    if (validTasks.length === 0) {
      return [{
        id: 'dummy',
        name: t('gantt.noTasksWithDates'),
        start: new Date(),
        end: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        type: 'task',
        progress: 0,
        isDisabled: true,
        styles: { progressColor: 'hsl(var(--muted))', backgroundColor: 'hsl(var(--muted)/0.5)', progressSelectedColor: 'hsl(var(--primary)/0.2)' }
      }];
    }

    return validTasks;
  }, [tasks, color, t]);

  const handleTaskChange = (task: GanttTask) => {
    if (task.id === 'dummy') return;
    updateTask.mutate({
      id: task.id,
      startDate: task.start.toISOString(),
      dueDate: task.end.toISOString(),
    });
  };

  const handleTaskClick = (task: GanttTask) => {
    if (task.id !== 'dummy') setSelectedTaskId(task.id);
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden p-4">
      <style>{`
        .gantt_chart {
          background-color: transparent !important;
        }
        .gantt-task-react-list-header {
          background-color: hsl(var(--muted)/0.5) !important;
          color: hsl(var(--muted-foreground)) !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
        }
        .gantt-task-react-calendar-header {
          background-color: hsl(var(--muted)/0.3) !important;
          color: hsl(var(--muted-foreground)) !important;
        }
        .gantt-task-react-grid-row {
          stroke: hsl(var(--border)/0.5) !important;
        }
        .gantt-task-react-grid-tick {
          stroke: hsl(var(--border)/0.5) !important;
        }
        .gantt-task-react-list-cell {
          color: hsl(var(--foreground)/0.8) !important;
          border-bottom: 1px solid hsl(var(--border)/0.3) !important;
        }
      `}</style>
      <div className="flex gap-2 mb-4">
        {Object.values(ViewMode).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
            viewMode === mode 
              ? 'bg-primary/20 text-primary border-primary/30 font-bold' 
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {t(`gantt.${mode}`)}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          onDateChange={handleTaskChange}
          onClick={handleTaskClick}
          listCellWidth="155px"
          columnWidth={60}
          barFill={70}
          barCornerRadius={6}
        />
      </div>
    </div>
  );
}
