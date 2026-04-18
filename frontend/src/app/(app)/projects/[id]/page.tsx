'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { Plus, ListTodo, KanbanSquare, CalendarDays, Table2, Loader2, Search, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from './components/TaskList';
import { TaskBoard } from './components/TaskBoard';
import { TaskGantt } from './components/TaskGantt';
import { TaskTable } from './components/TaskTable';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { AIProjectDashboard } from './components/AIProjectDashboard';
import {
  TaskFilterBar,
  DEFAULT_FILTERS,
  applyFilters,
  type TaskFilters,
  type GroupByField,
} from '@/components/tasks/TaskFilterBar';
import { use } from 'react';

interface ProjectDetailProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { id: projectId } = use(params);
  const openCreateTask = useUIStore((s) => s.openCreateTask);
  const [view, setView] = useState<'list' | 'board' | 'gantt' | 'table' | 'ai'>('list');
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [groupBy, setGroupBy] = useState<GroupByField>('status');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<any>(`/api/projects/${projectId}`),
  });

  const { data: rawTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get<any[]>(`/api/tasks/project/${projectId}`),
  });

  // Apply filters client-side
  const tasks = useMemo(() => applyFilters(rawTasks || [], filters), [rawTasks, filters]);

  const handleExportCSV = () => {
    if (!tasks || tasks.length === 0) return;
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Start Date', 'Due Date', 'Assignee'];
    const rows = tasks.map(t => [
      t.id, 
      `"${t.title.replace(/"/g, '""')}"`, 
      t.status, 
      t.priority, 
      t.startDate || '', 
      t.dueDate || '', 
      t.assignee?.name || 'Unassigned'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Project_${projectId}_Tasks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (projectLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return <div className="p-8 text-center text-muted-foreground bg-background h-full">Project not found</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* ── Project Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: project.color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">{project.name}</h1>
            {project.description && (
              <p className="text-xs text-muted-foreground truncate">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Member avatars */}
          {project.members && project.members.length > 0 && (
            <div className="flex items-center mr-1">
              {project.members.slice(0, 5).map((m: any, i: number) => (
                <div
                  key={m.userId}
                  style={{ zIndex: 5 - i, marginLeft: i > 0 ? -6 : 0 }}
                  className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[9px] font-bold text-primary relative"
                  title={m.user?.name}
                >
                  {m.user?.name?.charAt(0).toUpperCase()}
                </div>
              ))}
              {project.members.length > 5 && (
                <span className="text-[10px] text-muted-foreground/60 ml-1.5 font-medium">+{project.members.length - 5}</span>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-muted-foreground border-border bg-card hover:bg-muted"
            onClick={() => setSettingsOpen(true)}
            title="Project Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 gap-1.5 h-8 text-xs font-semibold"
            onClick={() => openCreateTask(projectId)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* ── View Switcher ── */}
      <div className="px-4 py-2 border-b border-border flex items-center gap-3 bg-muted/20 flex-shrink-0">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList className="h-7 bg-muted p-0.5 border border-border/50">
            <TabsTrigger value="list" className="h-6 text-xs px-2.5 rounded data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <ListTodo className="w-3.5 h-3.5 mr-1.5" /> List
            </TabsTrigger>
            <TabsTrigger value="board" className="h-6 text-xs px-2.5 rounded data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <KanbanSquare className="w-3.5 h-3.5 mr-1.5" /> Board
            </TabsTrigger>
            <TabsTrigger value="gantt" className="h-6 text-xs px-2.5 rounded data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Gantt
            </TabsTrigger>
            <TabsTrigger value="table" className="h-6 text-xs px-2.5 rounded data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Table2 className="w-3.5 h-3.5 mr-1.5" /> Table
            </TabsTrigger>
            <TabsTrigger value="ai" className="h-6 text-xs px-2.5 rounded data-[state=active]:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-indigo-500 font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Insights
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Filter Bar (List + Table views only) ── */}
      {(view === 'list' || view === 'table') && (
        <TaskFilterBar
          projectId={projectId}
          filters={filters}
          onFiltersChange={setFilters}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          totalCount={rawTasks?.length}
          filteredCount={tasks.length}
          onExport={handleExportCSV}
        />
      )}

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-hidden relative">
        {tasksLoading ? (
          <div className="flex h-full items-center justify-center bg-background">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30" />
          </div>
        ) : (
          <div className="absolute inset-0">
            {view === 'list'  && <TaskList  tasks={tasks} projectId={projectId} groupBy={groupBy} />}
            {view === 'board' && <TaskBoard tasks={rawTasks || []} projectId={projectId} />}
            {view === 'gantt' && <TaskGantt tasks={rawTasks || []} projectId={projectId} color={project.color} />}
            {view === 'table' && <TaskTable tasks={tasks} projectId={projectId} />}
            {view === 'ai'    && <AIProjectDashboard projectId={projectId} />}
          </div>
        )}
      </div>

      <ProjectSettingsModal 
        projectId={projectId} 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </div>
  );
}
