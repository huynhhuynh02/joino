'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutList, KanbanSquare } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
  isOverdue,
  cn,
} from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string; color: string };
  assigneeId?: string;
}

type GroupBy = 'status' | 'due_date' | 'project';

export default function MyTasksPage() {
  const t = useTranslations();
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);
  const [groupBy, setGroupBy] = useState<GroupBy>('due_date');
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get<Task[]>('/api/tasks/my-tasks'),
  });
  const { data: myTasks, isLoading, isError } = tasksQuery;

  const updateTaskStatus = useMutation({
    mutationFn: (args: { id: string; status: string }) =>
      api.put(`/api/tasks/${args.id}`, { status: args.status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-tasks'] }),
  });

  const handleToggleStatus = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    updateTaskStatus.mutate({ id: task.id, status: newStatus });
  };

  const filteredTasks = useMemo(() => {
    if (!myTasks) return [];
    if (!search) return myTasks;
    const q = search.toLowerCase();
    return myTasks.filter(t => t.title.toLowerCase().includes(q) || t.project.name.toLowerCase().includes(q));
  }, [myTasks, search]);

  const groups = useMemo(() => {
    const arr = filteredTasks;
    if (groupBy === 'status') {
      const g: Record<string, { label: string; tasks: Task[] }> = {};
      Object.entries(STATUS_CONFIG).forEach(([k, v]) => { g[k] = { label: t(`status.${k}`), tasks: [] }; });
      arr.forEach(t => { if (g[t.status]) g[t.status].tasks.push(t); });
      return Object.values(g).filter(group => group.tasks.length > 0);
    }
    if (groupBy === 'project') {
      const g: Record<string, { label: string; tasks: Task[]; color: string }> = {};
      arr.forEach(t => {
        if (!g[t.project.id]) g[t.project.id] = { label: t.project.name, color: t.project.color, tasks: [] };
        g[t.project.id].tasks.push(t);
      });
      return Object.values(g).sort((a,b) => a.label.localeCompare(b.label));
    }
    const g: Record<string, { label: string; tasks: Task[] }> = {
      overdue: { label: t('dashboard.overdue'), tasks: [] },
      today: { label: t('common.today'), tasks: [] },
      week: { label: t('common.thisWeek'), tasks: [] },
      later: { label: t('common.later'), tasks: [] },
      none: { label: t('common.noDueDate'), tasks: [] },
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfWeek = startOfToday + 7 * 24 * 60 * 60 * 1000;

    arr.forEach(t => {
      if (!t.dueDate) { g.none.tasks.push(t); return; }
      const due = new Date(t.dueDate).getTime();
      if (isOverdue(t.dueDate, t.status)) { g.overdue.tasks.push(t); }
      else if (due >= startOfToday && due < startOfToday + 86400000) { g.today.tasks.push(t); }
      else if (due < endOfWeek) { g.week.tasks.push(t); }
      else { g.later.tasks.push(t); }
    });
    return Object.values(g).filter(group => group.tasks.length > 0);
  }, [filteredTasks, groupBy, t]);

  return (
    <div className="view-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-primary" />
          {t('myTasks.title')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('myTasks.description')}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 mt-6 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Input 
            placeholder={t('myTasks.searchPlaceholder')} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-64 h-9 bg-card"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{t('common.groupBy')}:</span>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-40 h-9 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">{t('common.dueDate')}</SelectItem>
                <SelectItem value="status">{t('common.status')}</SelectItem>
                <SelectItem value="project">{t('common.project')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Tabs defaultValue="list" className="w-[200px]">
             <TabsList className="grid w-full grid-cols-2">
               <TabsTrigger value="list" className="flex gap-2 text-xs"><LayoutList className="w-3.5 h-3.5" /> {t('common.list')}</TabsTrigger>
               <TabsTrigger value="board" className="flex gap-2 text-xs"><KanbanSquare className="w-3.5 h-3.5" /> {t('common.board')}</TabsTrigger>
             </TabsList>
          </Tabs>
          <Badge variant="outline" className="bg-card text-muted-foreground border-border">
            {filteredTasks.length} {t('common.taskCount', { count: filteredTasks.length })}
          </Badge>
        </div>
      </div>

        <Tabs defaultValue="list" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex-1 mb-6 flex flex-col">
        {isError ? (
          <div className="p-8">
            <ErrorState onRetry={() => tasksQuery.refetch()} />
          </div>
        ) : isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2].map(g => (
              <div key={g}>
                <div className="bg-muted px-4 py-2 flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8 ml-2" />
                </div>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-lg font-medium text-foreground mb-1">
              {search ? t('common.noTasksSearch') : t('common.allCaughtUp')}
            </p>
            <p className="text-sm">{search ? t('common.tryAdjustSearch') : t('common.noTasksAssigned')}</p>
          </div>
        ) : (
          <>
            <TabsContent value="list" className="overflow-y-auto flex-1 m-0">
            {groups.map((group) => (
              <div key={group.label} className="mb-0 border-b border-border last:border-b-0">
                <div className="bg-muted px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border sticky top-0 z-10">
                  {(group as any).color && (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: (group as any).color }} />
                  )}
                  {group.label} <span className="opacity-60 font-normal ml-1">({group.tasks.length})</span>
                </div>
                <Table>
                  <TableHeader className="sr-only">
                    <TableRow>
                      <TableHead>{t('common.project')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                      <TableHead>{t('common.priority')}</TableHead>
                      <TableHead>{t('common.dueDate')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.tasks.map((task) => {
                      const statConf = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
                      const prioConf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                      const prioColors: Record<string, string> = {
                        LOW: 'text-muted-foreground bg-muted',
                        MEDIUM: 'text-yellow-500 bg-yellow-500/10',
                        HIGH: 'text-orange-500 bg-orange-500/10',
                        URGENT: 'text-destructive bg-destructive/10',
                      };

                      return (
                        <TableRow
                          key={task.id}
                          className="hover:bg-muted/50 cursor-pointer transition-colors group border-border border-b last:border-b-0"
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <TableCell className="w-[45%] py-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5" onClick={(e) => handleToggleStatus(e, task)}>
                                <Checkbox 
                                  checked={task.status === 'DONE'} 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="mb-1">
                                  <span className={cn("font-semibold text-foreground/90 text-sm group-hover:text-primary transition-colors", task.status === 'DONE' && "line-through text-muted-foreground/60")}>
                                    {task.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded w-max border border-border">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: task.project.color }}
                                  />
                                  {task.project.name}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="w-[15%] py-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/80 bg-background border border-border px-2 py-1 rounded w-max shadow-sm">
                              <span className={cn('w-2 h-2 rounded-full', statConf?.dotColor)} />
                              {t(`status.${task.status}`)}
                            </div>
                          </TableCell>

                          <TableCell className="w-[15%] py-3">
                            <Badge variant="secondary" className={cn('text-[10px] uppercase font-bold border-none px-2 py-0.5', prioColors[task.priority])}>
                              {t(`priority.${task.priority}`)}
                            </Badge>
                          </TableCell>

                          <TableCell className="w-[20%] py-3 text-right pr-6">
                            {task.dueDate ? (
                              <span className={cn('text-[11px] font-semibold tracking-wide', isOverdue(task.dueDate, task.status) ? 'text-destructive' : 'text-muted-foreground')}>
                                {formatDate(task.dueDate)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/40 italic">{t('common.noDueDate')}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
            </TabsContent>
            <TabsContent value="board" className="flex-1 overflow-x-auto p-4 m-0 bg-muted/20">
              <div className="flex gap-4 h-full pb-4 items-start">
                {groups.map((group) => (
                  <div key={group.label} className="w-80 flex-shrink-0 bg-muted/30 border border-border rounded-lg flex flex-col max-h-full">
                    <div className="p-3 font-semibold text-sm text-foreground/80 flex items-center justify-between border-b border-border">
                      <div className="flex items-center gap-2">
                         {(group as any).color && (
                           <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: (group as any).color }} />
                         )}
                         {group.label}
                      </div>
                      <Badge variant="secondary" className="bg-card text-muted-foreground border-border">{group.tasks.length}</Badge>
                    </div>
                    <div className="p-2 space-y-2 overflow-y-auto flex-1">
                      {group.tasks.map(task => {
                        const prioColors: Record<string, string> = { LOW: 'text-muted-foreground bg-muted', MEDIUM: 'text-yellow-500 bg-yellow-500/10', HIGH: 'text-orange-500 bg-orange-500/10', URGENT: 'text-destructive bg-destructive/10' };
                        return (
                          <Card 
                            key={task.id} 
                            className="shadow-sm border-border cursor-pointer hover:border-primary/50 transition-colors bg-card"
                            onClick={() => setSelectedTaskId(task.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <div className="mt-0.5" onClick={(e) => handleToggleStatus(e, task)}>
                                  <Checkbox checked={task.status === 'DONE'} />
                                </div>
                                <span className={cn("font-medium text-sm text-foreground/90 leading-tight", task.status === 'DONE' && "line-through text-muted-foreground/60")}>
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.project.color }} />
                                  <span className="truncate max-w-[100px]">{task.project.name}</span>
                                </div>
                                <Badge variant="secondary" className={cn('text-[9px] uppercase font-bold border-none px-1.5 py-0 h-4', prioColors[task.priority])}>
                                  {t(`priority.${task.priority}`)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </>
        )}
        </Tabs>
    </div>
  );
}
