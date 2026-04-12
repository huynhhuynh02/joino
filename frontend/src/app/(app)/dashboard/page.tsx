'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { CheckSquare, AlertCircle, TrendingUp, Layers, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { cn, formatDateRelative, getInitials, STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

interface DashboardStats {
  totalTasks: number;
  myTasks: number;
  overdueTasks: number;
  completedThisWeek: number;
  recentActivity: Array<{
    id: string;
    action: string;
    details: Record<string, unknown>;
    createdAt: string;
    user: { id: string; name: string; avatar: string | null };
    task: { id: string; title: string; projectId: string };
  }>;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string; color: string };
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function activityLabel(action: string, details: Record<string, unknown>): string {
  switch (action) {
    case 'task_created': return 'created this task';
    case 'status_changed': return `changed status: ${details.from} → ${details.to}`;
    case 'comment_added': return 'added a comment';
    case 'assignee_changed': return `assigned to ${details.to}`;
    case 'file_uploaded': return `uploaded ${details.filename}`;
    default: return action.replace(/_/g, ' ');
  }
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const openCreateProject = useUIStore((s) => s.openCreateProject);
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/api/projects/stats/dashboard'),
  });
  const { data: stats, isLoading: statsLoading } = statsQuery;

  const tasksQuery = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get<Task[]>('/api/tasks/my-tasks'),
  });
  const { data: myTasks, isLoading: tasksLoading } = tasksQuery;

  const [greetingText, setGreetingText] = useState('Welcome');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreetingText('Good morning');
    else if (hour < 18) setGreetingText('Good afternoon');
    else setGreetingText('Good evening');
  }, []);

  if (!mounted) {
    return (
      <div className="view-container">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-[104px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Handle global error
  if (statsQuery.isError || tasksQuery.isError) {
    return (
      <div className="view-container flex items-center justify-center">
        <ErrorState 
          onRetry={() => {
            if (statsQuery.isError) statsQuery.refetch();
            if (tasksQuery.isError) tasksQuery.refetch();
          }} 
        />
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {greetingText}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s what&apos;s happening in your workspace today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Layers}
          label="Total Tasks"
          value={stats?.totalTasks}
          color="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckSquare}
          label="My Tasks"
          value={stats?.myTasks}
          color="bg-primary/10 text-primary dark:bg-primary/20"
          loading={statsLoading}
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue"
          value={stats?.overdueTasks}
          color="bg-destructive/10 text-destructive dark:bg-destructive/20"
          loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Completed This Week"
          value={stats?.completedThisWeek}
          color="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
          loading={statsLoading}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">My Tasks</CardTitle>
                <Link href="/my-tasks">
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-7">
                    View all <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : !myTasks?.length ? (
                <div className="text-center py-8">
                   <CheckSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/60">No tasks assigned to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myTasks.slice(0, 8).map((task) => {
                    const statusConf = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
                    const priorityConf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                    const overdue = isOverdue(task.dueDate, task.status);

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/30 cursor-pointer transition-all"
                      >
                        <span
                           className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConf?.dotColor || 'bg-muted-foreground/40'}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground/90 truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {task.project?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] h-5 px-1.5', priorityConf?.className)}
                          >
                            {priorityConf?.label}
                          </Badge>
                          {task.dueDate && (
                            <span className={cn(
                              'text-xs',
                              overdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                            )}>
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !stats?.recentActivity?.length ? (
                 <p className="text-sm text-muted-foreground/60 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-2.5">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarImage src={activity.user.avatar || ''} />
                         <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                          {getInitials(activity.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-medium text-foreground/90">{activity.user.name}</span>{' '}
                          <span className="opacity-80">{activityLabel(activity.action, activity.details || {})}</span>{' '}
                          <button
                            className="text-primary hover:underline font-medium"
                            onClick={() => setSelectedTaskId(activity.task.id)}
                          >
                            {activity.task.title}
                          </button>
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {formatDateRelative(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-border mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-9 text-sm border-border hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                onClick={openCreateProject}
              >
                <Plus className="w-4 h-4" />
                Create New Project
              </Button>
              <Link href="/my-tasks" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-9 text-sm border-border hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                >
                  <CheckSquare className="w-4 h-4" />
                  View All My Tasks
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
